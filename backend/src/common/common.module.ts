import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { PermissionService } from './services/permission.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [LoggerService, LoggingMiddleware, PermissionService],
  exports: [LoggerService, LoggingMiddleware, PermissionService],
})
export class CommonModule {} 