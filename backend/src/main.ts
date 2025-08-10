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

// Add early error detection
console.log('=== MODULE IMPORTS COMPLETED ===');
console.log('All imports loaded successfully');

async function bootstrap() {
  console.log('Starting app creation...');
  console.log('Current working directory:', process.cwd());
  console.log('Node version:', process.version);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  let app;
  try {
    console.log('About to create NestJS app...');
    console.log('AppModule type:', typeof AppModule);
    console.log('AppModule constructor:', AppModule.constructor.name);
    
    console.log('About to call NestFactory.create...');
    
    // Test with a minimal module first
    console.log('Testing with minimal module...');
    const MinimalModule = {
      imports: [],
      controllers: [],
      providers: [],
    };
    
    try {
      const minimalApp = await NestFactory.create(MinimalModule as any, {
        logger: false,
      });
      console.log('Minimal module test successful');
      await minimalApp.close();
    } catch (minimalError) {
      console.error('Minimal module test failed:', minimalError);
    }
    
    // Now try the real module
    console.log('Testing with real AppModule...');
    const createPromise = NestFactory.create(AppModule, {
      // Disable built-in logger to allow our custom logger to take over
      // once the config is validated and loaded.
      logger: false,
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('NestFactory.create timed out after 30 seconds')), 30000);
    });
    
    app = await Promise.race([createPromise, timeoutPromise]);
    console.log('NestFactory.create completed successfully');
    console.log('App created successfully, getting services...');
  } catch (error) {
    console.error('FATAL: Failed to create NestJS app');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error cause:', error.cause);
    console.error('Error constructor:', error.constructor.name);
    console.error('Is error instanceof Error:', error instanceof Error);
    throw error;
  }

  // Trigger validated configuration; will throw on invalid env
  let configService;
  try {
    configService = app.get(ValidatedConfigService);
    console.log('Config service loaded');
  } catch (error) {
    console.error('Failed to load config service:', error);
    throw error;
  }

  // Get and attach logger service
  let logger;
  try {
    logger = app.get(LoggerService);
    app.useLogger(logger);
    console.log('Logger service loaded');
  } catch (error) {
    console.error('Failed to load logger service:', error);
    throw error;
  }

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
  try {
    const loggingMiddleware = app.get(LoggingMiddleware);
    app.use(loggingMiddleware.use.bind(loggingMiddleware));
    console.log('Logging middleware attached');
  } catch (error) {
    console.error('Failed to attach logging middleware:', error);
    // Don't throw here as it's not critical for startup
  }

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

// Enhanced error handling for deployment debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED PROMISE REJECTION ===');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('Stack:', reason instanceof Error ? reason.stack : 'No stack available');
  console.error('=====================================');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('===========================');
  process.exit(1);
});

// Main application error handler
bootstrap().catch((err) => {
  console.error('=== APPLICATION STARTUP FAILED ===');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Error cause:', err.cause);
  
  // Additional context for debugging
  console.error('Environment check:');
  console.error('NODE_ENV:', process.env.NODE_ENV);
  console.error('PORT:', process.env.PORT);
  console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.error('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.error('CORS_ORIGIN:', process.env.CORS_ORIGIN || '(not set)');
  console.error('Current working directory:', process.cwd());
  console.error('Node version:', process.version);
  console.error('===================================');
  
  process.exit(1);
});
