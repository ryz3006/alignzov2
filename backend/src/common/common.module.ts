import { Module, Global } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerService } from './services/logger.service';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { PermissionService } from './services/permission.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DataScopeService } from './services/data-scope.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [LoggerService, LoggingMiddleware, PermissionService, DataScopeService],
  exports: [LoggerService, LoggingMiddleware, PermissionService, DataScopeService],
})
export class CommonModule {} 

// Early config normalization for any consumers using process.env
(() => {
  try {
    const configPath = path.join(process.cwd(), 'config', 'config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const cfg = JSON.parse(raw);
      const b = cfg?.database || cfg?.backend?.database;
      const p = cfg?.ports || cfg?.backend?.ports;
      const r = cfg?.redis || cfg?.backend?.redis;
      const s = cfg?.security || cfg?.backend?.security;
      const c = cfg?.cors || cfg?.backend?.cors;
      if (b?.url) process.env.DATABASE_URL = b.url;
      if (p?.backend) process.env.PORT = String(p.backend);
      if (r?.url) process.env.REDIS_URL = r.url;
      if (s?.jwtSecret) process.env.JWT_SECRET = s.jwtSecret;
      if (c?.origin) process.env.CORS_ORIGIN = c.origin;
    }
  } catch {}
})();