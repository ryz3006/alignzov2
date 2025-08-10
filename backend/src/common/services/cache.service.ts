import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType | null = null;
  private redisConnected = false;
  private readonly defaultTTL = 3600; // 1 hour default

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (redisUrl) {
      this.redisClient = createClient({ url: redisUrl });

      this.redisClient.on('error', (err) => {
        if (!this.redisConnected) {
          this.logger.warn('Redis connection failed, falling back to database cache');
          this.redisConnected = false;
        }
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis connected successfully');
        this.redisConnected = true;
      });
    } else {
      this.logger.log('Redis not configured, using database cache fallback');
    }
  }

  async onModuleInit() {
    if (this.redisClient) {
      try {
        await this.redisClient.connect();
      } catch (error) {
        this.logger.warn('Redis connection failed, falling back to database cache');
        this.redisConnected = false;
      }
    }
  }

  async onModuleDestroy() {
    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.disconnect();
      } catch (error) {
        this.logger.warn('Error disconnecting from Redis:', error.message);
      }
    }
  }

  /**
   * Get value from cache (Redis or database fallback)
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.redisClient && this.redisConnected) {
      try {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        this.logger.warn(`Redis get failed for key ${key}, falling back to database`);
        return this.getFromDatabase(key);
      }
    }
    return this.getFromDatabase(key);
  }

  /**
   * Set value in cache (Redis or database fallback)
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), {
          EX: ttl,
        });
        return;
      } catch (error) {
        this.logger.warn(`Redis set failed for key ${key}, falling back to database`);
      }
    }
    await this.setInDatabase(key, value, ttl);
  }

  /**
   * Delete specific key
   */
  async del(key: string): Promise<void> {
    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.del(key);
        return;
      } catch (error) {
        this.logger.warn(`Redis delete failed for key ${key}, falling back to database`);
      }
    }
    await this.deleteFromDatabase(key);
  }

  /**
   * Delete all keys matching pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (this.redisClient && this.redisConnected) {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          this.logger.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
        }
        return;
      } catch (error) {
        this.logger.warn(`Redis pattern invalidation failed, falling back to database`);
      }
    }
    await this.invalidatePatternInDatabase(pattern);
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
    if (this.redisClient && this.redisConnected) {
      try {
        return (await this.redisClient.exists(key)) > 0;
      } catch (error) {
        this.logger.warn(`Redis exists check failed for key ${key}, falling back to database`);
        return this.existsInDatabase(key);
      }
    }
    return this.existsInDatabase(key);
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (this.redisClient && this.redisConnected) {
      try {
        const values = await this.redisClient.mGet(keys);
        return values.map(value => value ? JSON.parse(value) : null);
      } catch (error) {
        this.logger.warn(`Redis mget failed, falling back to database`);
        return this.mgetFromDatabase(keys);
      }
    }
    return this.mgetFromDatabase(keys);
  }

  /**
   * Set multiple keys at once
   */
  async mset(keyValuePairs: Record<string, any>, ttl: number = this.defaultTTL): Promise<void> {
    if (this.redisClient && this.redisConnected) {
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
        return;
      } catch (error) {
        this.logger.warn(`Redis mset failed, falling back to database`);
      }
    }
    await this.msetInDatabase(keyValuePairs, ttl);
  }

  /**
   * Increment a counter (useful for rate limiting)
   */
  async incr(key: string, ttl?: number): Promise<number> {
    if (this.redisClient && this.redisConnected) {
      try {
        const value = await this.redisClient.incr(key);
        if (ttl && value === 1) {
          await this.redisClient.expire(key, ttl);
        }
        return value;
      } catch (error) {
        this.logger.warn(`Redis increment failed for key ${key}, falling back to database`);
        return this.incrInDatabase(key, ttl);
      }
    }
    return this.incrInDatabase(key, ttl);
  }

  // Database fallback methods
  private async getFromDatabase<T>(key: string): Promise<T | null> {
    try {
      const cacheEntry = await this.prisma.cache.findUnique({
        where: { key },
      });
      
      if (!cacheEntry || cacheEntry.expiresAt < new Date()) {
        return null;
      }
      
      return JSON.parse(cacheEntry.value);
    } catch (error) {
      this.logger.warn(`Database cache get failed for key ${key}: ${error.message}`);
      return null;
    }
  }

  private async setInDatabase(key: string, value: any, ttl: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);
      
      await this.prisma.cache.upsert({
        where: { key },
        update: {
          value: JSON.stringify(value),
          expiresAt,
        },
        create: {
          key,
          value: JSON.stringify(value),
          expiresAt,
        },
      });
    } catch (error) {
      this.logger.warn(`Database cache set failed for key ${key}: ${error.message}`);
    }
  }

  private async deleteFromDatabase(key: string): Promise<void> {
    try {
      await this.prisma.cache.deleteMany({
        where: { key },
      });
    } catch (error) {
      this.logger.warn(`Database cache delete failed for key ${key}: ${error.message}`);
    }
  }

  private async existsInDatabase(key: string): Promise<boolean> {
    try {
      const cacheEntry = await this.prisma.cache.findUnique({
        where: { key },
      });
      return cacheEntry ? cacheEntry.expiresAt > new Date() : false;
    } catch (error) {
      this.logger.warn(`Database cache exists check failed for key ${key}: ${error.message}`);
      return false;
    }
  }

  private async mgetFromDatabase<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const cacheEntries = await this.prisma.cache.findMany({
        where: {
          key: { in: keys },
          expiresAt: { gt: new Date() },
        },
      });
      
      const result: (T | null)[] = [];
      for (const key of keys) {
        const entry = cacheEntries.find(e => e.key === key);
        result.push(entry ? JSON.parse(entry.value) : null);
      }
      
      return result;
    } catch (error) {
      this.logger.warn(`Database cache mget failed: ${error.message}`);
      return keys.map(() => null);
    }
  }

  private async msetInDatabase(keyValuePairs: Record<string, any>, ttl: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        await this.prisma.cache.upsert({
          where: { key },
          update: {
            value: JSON.stringify(value),
            expiresAt,
          },
          create: {
            key,
            value: JSON.stringify(value),
            expiresAt,
          },
        });
      }
    } catch (error) {
      this.logger.warn(`Database cache mset failed: ${error.message}`);
    }
  }

  private async incrInDatabase(key: string, ttl?: number): Promise<number> {
    try {
      const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : new Date(Date.now() + this.defaultTTL * 1000);
      
      const result = await this.prisma.cache.upsert({
        where: { key },
        update: {
          value: { increment: 1 },
          expiresAt,
        },
        create: {
          key,
          value: '1',
          expiresAt,
        },
      });
      
      return parseInt(result.value) || 0;
    } catch (error) {
      this.logger.warn(`Database cache increment failed for key ${key}: ${error.message}`);
      return 0;
    }
  }

  private async invalidatePatternInDatabase(pattern: string): Promise<void> {
    try {
      // Convert Redis pattern to SQL LIKE pattern
      const sqlPattern = pattern
        .replace(/\*/g, '%')
        .replace(/\?/g, '_');
      
      await this.prisma.cache.deleteMany({
        where: {
          key: { contains: sqlPattern },
        },
      });
    } catch (error) {
      this.logger.warn(`Database cache pattern invalidation failed: ${error.message}`);
    }
  }
}
