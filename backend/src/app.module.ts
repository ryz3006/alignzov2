import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService, PermissionGuard],
})
export class AppModule {}
