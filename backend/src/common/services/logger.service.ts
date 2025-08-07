import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request } from 'express';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    this.initializeLogger();
  }

  private initializeLogger() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          message,
          ...meta,
        });
      })
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    );

    // File transport for all logs
    const allLogsTransport = new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
    });

    // File transport for error logs only
    const errorLogsTransport = new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    });

    // File transport for debug logs
    const debugLogsTransport = new DailyRotateFile({
      filename: 'logs/debug-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      level: 'debug',
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: {
        service: 'alignzo-backend',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        allLogsTransport,
        errorLogsTransport,
        debugLogsTransport,
      ],
    });

    // Add console transport for development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: consoleFormat,
          level: 'debug',
        })
      );
    }

    // Handle uncaught exceptions and unhandled rejections
    this.logger.exceptions.handle(
      new DailyRotateFile({
        filename: 'logs/exceptions-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
      })
    );

    this.logger.rejections.handle(
      new DailyRotateFile({
        filename: 'logs/rejections-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
      })
    );
  }

  log(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { trace, ...context });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, context);
  }

  // Request logging methods
  logRequest(req: Request, responseTime?: number, statusCode?: number) {
    const context: LogContext = {
      correlationId: req.headers['x-correlation-id'] as string,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: (req as any).user?.id,
      responseTime,
      statusCode,
    };

    this.log(`HTTP ${req.method} ${req.url}`, context);
  }

  logError(error: Error, req?: Request, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    };

    if (req) {
      errorContext.correlationId = req.headers['x-correlation-id'] as string;
      errorContext.method = req.method;
      errorContext.url = req.url;
      errorContext.userId = (req as any).user?.id;
    }

    this.error(error.message, error.stack, errorContext);
  }

  // Authentication logging
  logAuthEvent(event: string, userId?: string, context?: LogContext) {
    this.log(`Auth: ${event}`, {
      ...context,
      userId,
      eventType: 'authentication',
    });
  }

  // Database logging
  logDatabaseQuery(query: string, duration: number, context?: LogContext) {
    this.debug(`Database query executed in ${duration}ms`, {
      ...context,
      query,
      duration,
      eventType: 'database',
    });
  }

  // Business logic logging
  logBusinessEvent(event: string, data?: any, context?: LogContext) {
    this.log(`Business: ${event}`, {
      ...context,
      data,
      eventType: 'business',
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: LogContext) {
    this.log(`Performance: ${operation} completed in ${duration}ms`, {
      ...context,
      operation,
      duration,
      eventType: 'performance',
    });
  }

  // Security logging
  logSecurityEvent(event: string, details?: any, context?: LogContext) {
    this.warn(`Security: ${event}`, {
      ...context,
      details,
      eventType: 'security',
    });
  }
} 