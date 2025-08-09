import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { CacheService } from '../services/cache.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Only invalidate cache on write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        try {
          const resource = this.extractResourceFromRoute(request.originalUrl);
          if (resource) {
            await this.invalidateCacheForResource(resource, request);
            this.logger.log(`Cache invalidated for resource: ${resource}`, {
              method,
              route: request.originalUrl,
              userId: (request as any).user?.id,
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to invalidate cache: ${error.message}`, {
            method,
            route: request.originalUrl,
          });
        }
      }),
    );
  }

  /**
   * Extract resource name from route
   */
  private extractResourceFromRoute(route: string): string | null {
    // Remove query parameters
    const cleanRoute = route.split('?')[0];
    
    // Extract resource from API routes
    const apiMatch = cleanRoute.match(/\/api\/(?:v\d+\/)?([^\/]+)/);
    if (apiMatch) {
      return apiMatch[1];
    }

    // Fallback - extract from simple routes
    const pathParts = cleanRoute.split('/').filter(part => part.length > 0);
    if (pathParts.length > 0) {
      return pathParts[0];
    }

    return null;
  }

  /**
   * Invalidate cache for specific resource and related resources
   */
  private async invalidateCacheForResource(resource: string, request: Request): Promise<void> {
    const userId = (request as any).user?.id;
    
    // Primary resource invalidation
    await this.cacheService.invalidateResource(resource);

    // User-specific cache invalidation
    if (userId) {
      await this.cacheService.invalidatePattern(`user:${userId}:*/${resource}*`);
    }

    // Invalidate related resources based on the modified resource
    const relatedResources = this.getRelatedResources(resource);
    for (const relatedResource of relatedResources) {
      await this.cacheService.invalidateResource(relatedResource);
      if (userId) {
        await this.cacheService.invalidatePattern(`user:${userId}:*/${relatedResource}*`);
      }
    }
  }

  /**
   * Get resources that should be invalidated when the given resource changes
   */
  private getRelatedResources(resource: string): string[] {
    const relationships: Record<string, string[]> = {
      // Users changes affect these resources
      'users': ['teams', 'projects', 'roles', 'permissions', 'work-logs', 'time-sessions'],
      
      // Projects changes affect these resources
      'projects': ['teams', 'users', 'work-logs', 'time-sessions', 'project-members'],
      
      // Teams changes affect these resources
      'teams': ['users', 'projects', 'team-members'],
      
      // Roles/permissions changes affect all user-related data
      'roles': ['users', 'permissions', 'teams', 'projects'],
      'permissions': ['users', 'roles', 'teams', 'projects'],
      
      // Work logs affect analytics and project data
      'work-logs': ['projects', 'analytics', 'time-sessions'],
      
      // Time sessions affect analytics and project data
      'time-sessions': ['projects', 'analytics', 'work-logs'],
      
      // Organization changes affect everything
      'organizations': ['users', 'teams', 'projects', 'roles', 'permissions'],
      
      // Device sessions only affect user data
      'device-sessions': ['users'],
    };

    return relationships[resource] || [];
  }
}
