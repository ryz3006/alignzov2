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

  // Security middleware
  app.use(helmet());
  app.use(compression());
  
  // Cookie parsing middleware
  app.use(cookieParser());

  // Logging middleware
  const loggingMiddleware = app.get(LoggingMiddleware);
  app.use(loggingMiddleware.use.bind(loggingMiddleware));

  // CORS configuration
  app.enableCors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
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
