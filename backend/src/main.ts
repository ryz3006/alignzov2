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
  console.log('=== BOOTSTRAP START ===');
  
  console.log('Creating NestJS app...');
  let app;
  try {
    app = await NestFactory.create(AppModule, {
      // Disable built-in logger to allow our custom logger to take over
      // once the config is validated and loaded.
      logger: false,
    });
    console.log('NestJS app created successfully');
  } catch (appCreationError) {
    console.error('=== APP CREATION FAILED ===');
    console.error('Error during NestFactory.create():', appCreationError?.message);
    console.error('Stack:', appCreationError?.stack);
    throw appCreationError;
  }

  // Trigger validated configuration; will throw on invalid env
  console.log('Getting config service...');
  const configService = app.get(ValidatedConfigService);
  console.log('Config service obtained');

  // Get and attach logger service
  console.log('Getting logger service...');
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  console.log('Logger service attached');

  // Test database connection
  console.log('Testing database connection...');
  try {
    const prisma = app.get('PrismaService');
    console.log('PrismaService obtained');
  } catch (e) {
    console.log('PrismaService error:', e?.message);
  }

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
  console.log('Starting server on port:', port);
  await app.listen(port);
  console.log('Server listening on port:', port);

  const mode = configService.get('NODE_ENV');
  logger.log(`🚀 Backend starting in: ${mode.toUpperCase()} mode`);
  try {
    logger.log(`🌐 Backend URL: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/v1/docs`);
    console.log('=== BOOTSTRAP COMPLETE ===');
  } catch (e) {
    // noop if logger not ready
    console.log('=== BOOTSTRAP COMPLETE (logger not ready) ===');
  }
}

bootstrap().catch((err) => {
  // Fallback to console.error if the logger hasn't been initialized
  console.error('=== APPLICATION STARTUP FAILED ===');
  console.error('Error:', err);
  console.error('Stack:', err?.stack);
  console.error('Message:', err?.message);
  console.error('Environment check:');
  console.error('NODE_ENV:', process.env.NODE_ENV);
  console.error('PORT:', process.env.PORT);
  console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.error('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.error('REDIS_URL:', process.env.REDIS_URL || '(empty)');
  console.error('===================================');
  process.exit(1);
});
