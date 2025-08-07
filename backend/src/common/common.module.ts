import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { LoggingMiddleware } from './middleware/logging.middleware';

@Global()
@Module({
  providers: [LoggerService, LoggingMiddleware],
  exports: [LoggerService, LoggingMiddleware],
})
export class CommonModule {} 