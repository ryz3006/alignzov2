import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { IdempotencyService } from '../services/idempotency.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly idempotencyService: IdempotencyService,
    private readonly logger: LoggerService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method;

    // Only apply idempotency to POST, PUT, PATCH requests
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return next.handle();
    }

    const idempotencyKey = request.headers['idempotency-key'] as string;
    
    // If no idempotency key provided, continue without idempotency check
    if (!idempotencyKey) {
      return next.handle();
    }

    // Validate idempotency key format
    if (!this.idempotencyService.validateIdempotencyKey(idempotencyKey)) {
      throw new BadRequestException(
        'Invalid Idempotency-Key format. Must be UUID v4 or alphanumeric string (8-64 characters)',
      );
    }

    const userId = (request as any).user?.id;
    if (!userId) {
      // If no user context, skip idempotency (for public endpoints)
      return next.handle();
    }

    const route = this.getRoutePattern(request);
    const requestBody = request.body;

    try {
      // Check if this is an idempotent request
      const idempotencyResult = await this.idempotencyService.checkIdempotency(
        userId,
        route,
        idempotencyKey,
        requestBody,
      );

      if (!idempotencyResult.isNew) {
        // Return cached response
        const cachedResponse = idempotencyResult.response;
        response.status(cachedResponse.statusCode);
        
        this.logger.log('Returning cached idempotent response', {
          userId,
          route,
          idempotencyKey: idempotencyKey.substring(0, 8) + '...',
          statusCode: cachedResponse.statusCode,
        });
        
        return of(cachedResponse.data);
      }

      // Process new request and cache the response
      return next.handle().pipe(
        tap(async (responseData) => {
          try {
            await this.idempotencyService.storeResponse(
              idempotencyResult.key,
              responseData,
              response.statusCode,
            );
          } catch (error) {
            // Don't fail the request if caching fails
            this.logger.warn(`Failed to cache idempotent response: ${error.message}`, {
              userId,
              route,
              idempotencyKey: idempotencyKey.substring(0, 8) + '...',
            });
          }
        }),
        catchError(async (error) => {
          // Don't cache error responses for idempotency
          this.logger.warn('Request failed, not caching for idempotency', {
            userId,
            route,
            idempotencyKey: idempotencyKey.substring(0, 8) + '...',
            error: error.message,
          });
          throw error;
        }),
      );
    } catch (error) {
      this.logger.error(`Idempotency check failed: ${error.message}`, error.stack, {
        userId,
        route,
        idempotencyKey: idempotencyKey.substring(0, 8) + '...',
      });
      
      // If idempotency service fails, continue with request to avoid blocking
      return next.handle();
    }
  }

  /**
   * Extract route pattern from request for consistent caching
   */
  private getRoutePattern(request: Request): string {
    // Get the route pattern from the request URL
    let route = request.originalUrl || request.url;
    
    // Remove query parameters
    route = route.split('?')[0];
    
    // Replace dynamic segments with placeholders for consistent caching
    // Replace UUIDs with :id placeholder
    route = route.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '/:id'
    );
    
    // Replace numeric IDs with :id placeholder
    route = route.replace(/\/\d+/g, '/:id');
    
    return route;
  }
}
