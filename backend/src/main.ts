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
  console.log('Starting app creation...');
  console.log('Current working directory:', process.cwd());
  console.log('Node version:', process.version);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  let app;
  try {
    console.log('About to create NestJS app...');
    console.log('AppModule imports count:', AppModule.imports?.length || 0);
    console.log('AppModule providers count:', AppModule.providers?.length || 0);
    
    app = await NestFactory.create(AppModule, {
      // Disable built-in logger to allow our custom logger to take over
      // once the config is validated and loaded.
      logger: false,
    });
    console.log('App created successfully, getting services...');
  } catch (error) {
    console.error('FATAL: Failed to create NestJS app');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error cause:', error.cause);
    throw error;
  }

  // Trigger validated configuration; will throw on invalid env
  const configService = app.get(ValidatedConfigService);
  console.log('Config service loaded');

  // Get and attach logger service
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  console.log('Logger service loaded');

  // CORS configuration
  const corsOriginString = configService.get('CORS_ORIGIN');
  const corsOrigins = corsOriginString
    ? corsOriginString.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3002',
      ];
  
  logger.log(`Configuring CORS for origins: ${corsOrigins.join(', ')}`);

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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap().catch((err) => {
  // Fallback to console.error if the logger hasn't been initialized
  console.error('Application failed to start:', err);
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  process.exit(1);
});
