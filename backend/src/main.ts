import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { LoggerService } from './common/services/logger.service';

const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get logger service
  const logger = app.get(LoggerService);

  // Security middleware - temporarily disabled for CORS testing
  // app.use(helmet({
  //   crossOriginResourcePolicy: { policy: "cross-origin" },
  //   crossOriginEmbedderPolicy: false,
  //   contentSecurityPolicy: {
  //     directives: {
  //       defaultSrc: ["'self'"],
  //       styleSrc: ["'self'", "'unsafe-inline'"],
  //       scriptSrc: ["'self'"],
  //       imgSrc: ["'self'", "data:", "https:"],
  //     },
  //   },
  // }));
  app.use(compression());
  
  // Cookie parsing middleware
  app.use(cookieParser());

  // Logging middleware
  const loggingMiddleware = app.get(LoggingMiddleware);
  app.use(loggingMiddleware.use.bind(loggingMiddleware));

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3002', 'http://10.0.15.110:3000', 'http://10.0.15.110:3001'];
  
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
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

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

  // Global prefix
  app.setGlobalPrefix('api');

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
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
