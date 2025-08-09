import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType;
  private readonly defaultTTL = 3600; // 1 hour default

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.redisClient = createClient({
      url: this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis connection error', err.message);
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }

  async onModuleInit() {
    // Connect to Redis asynchronously without blocking app startup
    this.connectRedis();
  }

  private async connectRedis() {
    try {
      await this.redisClient.connect();
    } catch (error) {
      this.logger.error('Redis connection failed during startup', error.message);
      this.logger.warn('Redis caching will be disabled until connection is restored');
    }
  }

  async onModuleDestroy() {
    await this.redisClient.disconnect();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.warn(`Failed to get cache key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await this.redisClient.set(key, JSON.stringify(value), {
        EX: ttl,
      });
    } catch (error) {
      this.logger.warn(`Failed to set cache key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete specific key
   */
  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.warn(`Failed to delete cache key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
        this.logger.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to invalidate pattern ${pattern}: ${error.message}`);
    }
  }

  /**
   * Invalidate cache by resource prefix
   */
  async invalidateResource(resource: string): Promise<void> {
    const patterns = [
      `*/${resource}*`,
      `*/${resource}/*`,
      `*/api/v1/${resource}*`,
      `*/api/${resource}*`,
    ];

    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
  }

  /**
   * Generate cache key from request URL and user
   */
  generateCacheKey(url: string, userId?: string): string {
    const baseKey = url.replace(/\?.*$/, ''); // Remove query params for base key
    return userId ? `user:${userId}:${baseKey}` : `global:${baseKey}`;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      return (await this.redisClient.exists(key)) > 0;
    } catch (error) {
      this.logger.warn(`Failed to check existence of key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redisClient.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      this.logger.warn(`Failed to get multiple keys: ${error.message}`);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset(keyValuePairs: Record<string, any>, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const serializedPairs: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs.push(key, JSON.stringify(value));
      }
      
      await this.redisClient.mSet(serializedPairs);
      
      // Set TTL for each key
      for (const key of Object.keys(keyValuePairs)) {
        await this.redisClient.expire(key, ttl);
      }
    } catch (error) {
      this.logger.warn(`Failed to set multiple keys: ${error.message}`);
    }
  }

  /**
   * Increment a counter (useful for rate limiting)
   */
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const value = await this.redisClient.incr(key);
      if (ttl && value === 1) {
        await this.redisClient.expire(key, ttl);
      }
      return value;
    } catch (error) {
      this.logger.warn(`Failed to increment key ${key}: ${error.message}`);
      return 0;
    }
  }
}
