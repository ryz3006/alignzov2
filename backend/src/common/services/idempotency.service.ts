import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import { LoggerService } from './logger.service';
import * as crypto from 'crypto';

export interface IdempotencyResult {
  isNew: boolean;
  response?: any;
  key: string;
}

@Injectable()
export class IdempotencyService {
  private readonly defaultTTL = 86400; // 24 hours

  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Generate idempotency key from request details
   */
  private generateIdempotencyKey(
    userId: string,
    route: string,
    idempotencyKey: string,
    requestBody?: any,
  ): string {
    // Create a hash of the request body for additional uniqueness
    const bodyHash = requestBody 
      ? crypto.createHash('sha256').update(JSON.stringify(requestBody)).digest('hex').substring(0, 16)
      : 'nobody';
    
    return `idempotency:${userId}:${route}:${idempotencyKey}:${bodyHash}`;
  }

  /**
   * Check if request is idempotent and return cached response if exists
   */
  async checkIdempotency(
    userId: string,
    route: string,
    idempotencyKey: string,
    requestBody?: any,
  ): Promise<IdempotencyResult> {
    const key = this.generateIdempotencyKey(userId, route, idempotencyKey, requestBody);
    
    try {
      const cachedResponse = await this.cacheService.get(key);
      
      if (cachedResponse) {
        this.logger.log(`Idempotent request detected, returning cached response`, {
          userId,
          route,
          idempotencyKey: idempotencyKey.substring(0, 8) + '...',
        });
        
        return {
          isNew: false,
          response: cachedResponse,
          key,
        };
      }
      
      return {
        isNew: true,
        key,
      };
    } catch (error) {
      this.logger.warn(`Failed to check idempotency: ${error.message}`, {
        userId,
        route,
        idempotencyKey: idempotencyKey.substring(0, 8) + '...',
      });
      
      // On error, treat as new request to avoid blocking
      return {
        isNew: true,
        key,
      };
    }
  }

  /**
   * Store response for idempotency
   */
  async storeResponse(
    key: string,
    response: any,
    statusCode: number,
    ttl: number = this.defaultTTL,
  ): Promise<void> {
    try {
      const responseData = {
        data: response,
        statusCode,
        timestamp: new Date().toISOString(),
        ttl,
      };
      
      await this.cacheService.set(key, responseData, ttl);
      
      this.logger.log(`Stored idempotent response`, {
        key: key.substring(0, 50) + '...',
        statusCode,
        ttl,
      });
    } catch (error) {
      this.logger.warn(`Failed to store idempotent response: ${error.message}`, {
        key: key.substring(0, 50) + '...',
      });
    }
  }

  /**
   * Clean up expired idempotency keys (can be called by cron job)
   */
  async cleanupExpiredKeys(): Promise<void> {
    try {
      await this.cacheService.invalidatePattern('idempotency:*');
      this.logger.log('Cleaned up expired idempotency keys');
    } catch (error) {
      this.logger.warn(`Failed to cleanup idempotency keys: ${error.message}`);
    }
  }

  /**
   * Remove specific idempotency key (useful for testing or manual cleanup)
   */
  async removeIdempotencyKey(
    userId: string,
    route: string,
    idempotencyKey: string,
    requestBody?: any,
  ): Promise<void> {
    const key = this.generateIdempotencyKey(userId, route, idempotencyKey, requestBody);
    await this.cacheService.del(key);
  }

  /**
   * Validate idempotency key format
   */
  validateIdempotencyKey(key: string): boolean {
    // UUID v4 format validation
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // Custom format validation (alphanumeric + hyphens, 8-64 chars)
    const customFormatRegex = /^[a-zA-Z0-9-_]{8,64}$/;
    
    return uuidV4Regex.test(key) || customFormatRegex.test(key);
  }
}
