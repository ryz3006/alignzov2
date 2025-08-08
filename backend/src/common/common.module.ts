import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { PermissionService } from './services/permission.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DataScopeService } from './services/data-scope.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [LoggerService, LoggingMiddleware, PermissionService, DataScopeService],
  exports: [LoggerService, LoggingMiddleware, PermissionService, DataScopeService],
})
export class CommonModule {} 