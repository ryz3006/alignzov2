import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './services/cache.service';
import { IdempotencyService } from './services/idempotency.service';
import { LoggerService } from './services/logger.service';
import { CachingInterceptor } from './interceptors/caching.interceptor';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';
import { CacheInvalidationInterceptor } from './interceptors/cache-invalidation.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LoggerService,
    CacheService,
    IdempotencyService,
    CachingInterceptor,
    IdempotencyInterceptor,
    CacheInvalidationInterceptor,
  ],
  exports: [
    LoggerService,
    CacheService,
    IdempotencyService,
    CachingInterceptor,
    IdempotencyInterceptor,
    CacheInvalidationInterceptor,
  ],
})
export class CommonModule {}
