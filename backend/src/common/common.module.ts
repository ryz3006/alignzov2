import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './services/cache.service';
import { IdempotencyService } from './services/idempotency.service';
import { LoggerService } from './services/logger.service';
import { DataScopeService } from './services/data-scope.service';
import { PermissionService } from './services/permission.service';
import { CachingInterceptor } from './interceptors/caching.interceptor';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';
import { CacheInvalidationInterceptor } from './interceptors/cache-invalidation.interceptor';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    LoggerService,
    CacheService,
    IdempotencyService,
    DataScopeService,
    PermissionService,
    LoggingMiddleware,
    CachingInterceptor,
    IdempotencyInterceptor,
    CacheInvalidationInterceptor,
  ],
  exports: [
    LoggerService,
    CacheService,
    IdempotencyService,
    DataScopeService,
    PermissionService,
    LoggingMiddleware,
    CachingInterceptor,
    IdempotencyInterceptor,
    CacheInvalidationInterceptor,
  ],
})
export class CommonModule {}
