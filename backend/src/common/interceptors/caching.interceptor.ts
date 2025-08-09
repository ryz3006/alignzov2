import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import { Request } from 'express';
import { CacheService } from '../services/cache.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class CachingInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const userId = (request as any).user?.id;
    const cacheKey = this.cacheService.generateCacheKey(request.originalUrl, userId);

    try {
      // Check if data is cached
      const cachedData = await this.cacheService.get<any>(cacheKey);
      if (cachedData) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        
        // Set ETag header if available
        if (cachedData && typeof cachedData === 'object' && 'etag' in cachedData) {
          response.set('ETag', cachedData.etag);
        }
        
        return of(cachedData && typeof cachedData === 'object' && 'data' in cachedData ? cachedData.data : cachedData);
      }

      // Data not cached, fetch and cache it
      return next.handle().pipe(
        tap(async (data) => {
          try {
            // Generate ETag for the response
            const etag = this.generateETag(data);
            response.set('ETag', etag);

            // Cache the response with metadata
            const cacheData = {
              data,
              etag,
              timestamp: new Date().toISOString(),
            };

            // Determine TTL based on route
            const ttl = this.getTTLForRoute(request.originalUrl);
            await this.cacheService.set(cacheKey, cacheData, ttl);
            
            this.logger.debug(`Cached response for key: ${cacheKey} with TTL: ${ttl}s`);
          } catch (error) {
            this.logger.warn(`Failed to cache response: ${error.message}`, {
              cacheKey,
              route: request.originalUrl,
            });
          }
        }),
      );
    } catch (error) {
      this.logger.warn(`Cache lookup failed: ${error.message}`, {
        cacheKey,
        route: request.originalUrl,
      });
      
      // If cache fails, continue with normal request
      return next.handle();
    }
  }

  /**
   * Generate ETag for response data
   */
  private generateETag(data: any): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `"${hash}"`;
  }

  /**
   * Determine cache TTL based on route patterns
   */
  private getTTLForRoute(route: string): number {
    // Static data - cache longer
    if (route.includes('/roles') || route.includes('/permissions') || route.includes('/organizations')) {
      return 3600; // 1 hour
    }
    
    // User profile data - medium cache
    if (route.includes('/users/me') || route.includes('/users/profile')) {
      return 900; // 15 minutes
    }
    
    // List endpoints - shorter cache
    if (route.includes('/users') || route.includes('/projects') || route.includes('/teams')) {
      return 600; // 10 minutes
    }
    
    // Time-sensitive data - very short cache
    if (route.includes('/time-sessions') || route.includes('/work-logs') || route.includes('/analytics')) {
      return 300; // 5 minutes
    }
    
    // Default cache duration
    return 600; // 10 minutes
  }
}
