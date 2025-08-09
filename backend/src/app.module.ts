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
// import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    (() => { console.log('Loading ConfigModule...'); return ConfigModule.forRoot({ isGlobal: true }); })(),
    (() => { console.log('Loading AppConfigModule...'); return AppConfigModule; })(),
    (() => { console.log('Loading ThrottlerModule...'); return ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]); })(),
    (() => { console.log('Loading CommonModule...'); return CommonModule; })(),
    (() => { console.log('Loading PrismaModule...'); return PrismaModule; })(),
    (() => { console.log('Loading AuthModule...'); return AuthModule; })(),
    (() => { console.log('Loading UsersModule...'); return UsersModule; })(),
    (() => { console.log('Loading TeamsModule...'); return TeamsModule; })(),
    (() => { console.log('Loading ProjectsModule...'); return ProjectsModule; })(),
    (() => { console.log('Loading WorkLogsModule...'); return WorkLogsModule; })(),
    (() => { console.log('Loading TimeSessionsModule...'); return TimeSessionsModule; })(),
    (() => { console.log('Loading RolesModule...'); return RolesModule; })(),
    (() => { console.log('Loading PermissionsModule...'); return PermissionsModule; })(),
    (() => { console.log('Loading OrganizationsModule...'); return OrganizationsModule; })(),
    (() => { console.log('Loading AnalyticsModule...'); return AnalyticsModule; })(),
    (() => { console.log('Loading AuditLogsModule...'); return AuditLogsModule; })(),
    (() => { console.log('Loading DeviceSessionsModule...'); return DeviceSessionsModule; })(),
    (() => { console.log('Loading MetricsModule...'); return MetricsModule; })(),
    // BullModule.forRoot({
    //   connection: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379', 10),
    //   },
    // }),
    (() => { console.log('Loading VaultModule...'); return VaultModule; })(),
    (() => { console.log('Loading SyncModule...'); return SyncModule; })(),
    // UploadsModule,
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
