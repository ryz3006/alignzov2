import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { ProjectsModule } from './projects/projects.module';
import { WorkLogsModule } from './work-logs/work-logs.module';
import { TimeSessionsModule } from './time-sessions/time-sessions.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CommonModule } from './common/common.module';
import { PermissionGuard } from './common/guards/permission.guard';
import { HttpErrorEnvelopeFilter } from './common/filters/http-exception.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { CachingInterceptor } from './common/interceptors/caching.interceptor';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { CacheInvalidationInterceptor } from './common/interceptors/cache-invalidation.interceptor';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AppConfigModule } from './config/config.module';
import { DeviceSessionsModule } from './device-sessions/device-sessions.module';
import { MetricsModule } from './metrics/metrics.module';
// import { BullModule } from '@nestjs/bullmq';
import { VaultModule } from './vault/vault.module';
import { SyncModule } from './sync/sync.module';
import { UploadsModule } from './Uploads/uploads.module'; // <-- Corrected path

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    CommonModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    ProjectsModule,
    WorkLogsModule,
    TimeSessionsModule,
    RolesModule,
    PermissionsModule,
    OrganizationsModule,
    AnalyticsModule,
    AuditLogsModule,
    DeviceSessionsModule,
    MetricsModule,
    // BullModule.forRoot({
    //   connection: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379', 10),
    //   },
    // }),
    VaultModule,
    SyncModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PermissionGuard,
    { provide: APP_FILTER, useClass: HttpErrorEnvelopeFilter },
    { provide: APP_INTERCEPTOR, useClass: CachingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CacheInvalidationInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
