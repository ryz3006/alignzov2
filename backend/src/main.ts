import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { LoggerService } from './common/services/logger.service';
import * as fs from 'fs';
import * as path from 'path';

const cookieParser = require('cookie-parser');

async function bootstrap() {
  // Load standardized config.json (if present) and prime env vars
  let configSummary: any = {};
  let usedConfigSource = 'none';
  try {
    const configPath = path.join(process.cwd(), 'config', 'config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const cfg = JSON.parse(raw);
      const b = cfg?.database || cfg?.backend?.database || cfg?.backend?.config?.database || cfg?.backend?.database;
      const p = cfg?.ports || cfg?.backend?.ports;
      const r = cfg?.redis || cfg?.backend?.redis;
      const s = cfg?.security || cfg?.backend?.security;
      const c = cfg?.cors || cfg?.backend?.cors;
      if (b?.url) process.env.DATABASE_URL = b.url;
      if (p?.backend) process.env.PORT = String(p.backend);
      if (r?.url) process.env.REDIS_URL = r.url;
      if (s?.jwtSecret) process.env.JWT_SECRET = s.jwtSecret;
      if (c?.origin) process.env.CORS_ORIGIN = c.origin;
      const firebaseSa = cfg?.firebase?.serviceAccountPath || cfg?.backend?.firebase?.serviceAccountPath;
      if (firebaseSa) process.env.GOOGLE_APPLICATION_CREDENTIALS = firebaseSa;
      usedConfigSource = 'backend/config/config.json';
      configSummary = { databaseUrl: Boolean(b?.url), backendPort: p?.backend, redisUrl: Boolean(r?.url), corsOrigin: c?.origin, firebaseSaPath: Boolean(firebaseSa) };
    } else {
      // Fallback to .env if present
      const dotenv = await import('dotenv');
      dotenv.config();
      usedConfigSource = 'backend/.env';
      configSummary = { databaseUrl: Boolean(process.env.DATABASE_URL), backendPort: process.env.PORT, redisUrl: Boolean(process.env.REDIS_URL), corsOrigin: process.env.CORS_ORIGIN, firebaseSaPath: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) };
    }
  } catch (e) {
    // Non-fatal
    // eslint-disable-next-line no-console
    console.warn('Config bootstrap warning:', e);
  }

  const app = await NestFactory.create(AppModule);

  // Get logger service
  const logger = app.get(LoggerService);

  // CORS configuration - must come before Helmet
  console.log('CORS_ORIGIN from env:', process.env.CORS_ORIGIN);
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3002', 'http://10.0.15.110:3000', 'http://10.0.15.110:3001'];
  console.log('CORS origins:', corsOrigins);
  
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

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
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
  
  const mode = process.env.NODE_ENV || 'development';
  logger.log(`🚀 Backend starting in: ${mode.toUpperCase()} mode`);
  logger.log(`🧩 Config source: ${usedConfigSource}`);
  logger.log(`🔧 Config summary: DATABASE_URL=${configSummary.databaseUrl ? 'set' : 'missing'}, PORT=${port}, REDIS_URL=${configSummary.redisUrl ? 'set' : 'missing'}, CORS_ORIGIN=${configSummary.corsOrigin || 'missing'}, FIREBASE_SA=${configSummary.firebaseSaPath ? 'set' : 'missing'}`);
  if (!configSummary.databaseUrl) logger.warn('DATABASE_URL missing. Prisma may fail to connect.');
  logger.log(`🌐 Backend URL: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
