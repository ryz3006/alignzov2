import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Generate correlation ID if not present
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    req.headers['x-correlation-id'] = correlationId;

    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', correlationId);

    // Log incoming request
    this.logger.logRequest(req);

    // Capture response data
    const originalSend = res.send;
    const startTime = Date.now();
    const logger = this.logger; // Capture logger reference

    res.send = function (body) {
      const responseTime = Date.now() - startTime;
      
      // Log response
      logger.logRequest(req, responseTime, res.statusCode);
      
      return originalSend.call(this, body);
    };

    // Handle errors
    const originalError = res.status;
    res.status = function (code) {
      if (code >= 400) {
        logger.warn(`HTTP ${code} response`, {
          correlationId,
          method: req.method,
          url: req.url,
          statusCode: code,
        });
      }
      return originalError.call(this, code);
    };

    next();
  }
} 