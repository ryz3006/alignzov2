import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { LoggerService } from './common/services/logger.service';
import { ValidatedConfigService } from './config/config.service';
// import './tracing'; // Import OpenTelemetry tracer - disabled for now
import * as fs from 'fs';
import * as path from 'path';

const cookieParser = require('cookie-parser');

async function bootstrap() {
  // Explicitly create with Express platform
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Trigger validated configuration; will throw on invalid env
  const configService = app.get(ValidatedConfigService);

  // Get and attach logger service
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // CORS configuration
  const corsOriginString = configService.get('CORS_ORIGIN');
  let corsOrigins: string[] | boolean;
  
  if (corsOriginString) {
    corsOrigins = corsOriginString.split(',').map((origin) => origin.trim());
    logger.log(`Configuring CORS for specific origins: ${(corsOrigins as string[]).join(', ')}`);
  } else {
    // In production, default to false for security
    // In development, allow all origins
    corsOrigins = process.env.NODE_ENV === 'production' ? false : true;
    logger.log(`CORS configured for ${process.env.NODE_ENV} mode: ${corsOrigins === true ? 'all origins' : 'disabled'}`);
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Security middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );
  app.use(compression());

  // Cookie parsing middleware
  app.use(cookieParser());

  // Logging middleware
  const loggingMiddleware = app.get(LoggingMiddleware);
  app.use(loggingMiddleware.use.bind(loggingMiddleware));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Re-enabled strict validation
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API versioning prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Alignzo API')
    .setDescription('Enterprise Team Productivity Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = configService.get('PORT');
  await app.listen(port);

  const mode = configService.get('NODE_ENV');
  logger.log(`🚀 Backend starting in: ${mode.toUpperCase()} mode`);
  logger.log(`🌐 Backend URL: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/v1/docs`);
}

bootstrap().catch((err) => {
  console.error('Application startup failed:', err);
  process.exit(1);
});
