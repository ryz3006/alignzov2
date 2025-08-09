import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { createClient } from 'redis';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Welcome message',
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('health/db')
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({
    status: 200,
    description: 'Database is healthy',
  })
  async getDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('healthz')
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readyz')
  @ApiOperation({ summary: 'Readiness probe (DB/Redis)' })
  async readiness() {
    const result: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: { db: 'unknown', redis: 'unknown' },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      result.checks.db = 'connected';
    } catch (e: any) {
      result.checks.db = 'disconnected';
      result.status = 'error';
      result.dbError = e?.message;
    }

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const client = createClient({ url: redisUrl });
        await client.connect();
        const pong = await client.ping();
        result.checks.redis = pong === 'PONG' ? 'connected' : 'error';
        await client.quit();
      } catch (e: any) {
        result.checks.redis = 'disconnected';
        result.status = 'error';
        result.redisError = e?.message;
      }
    } else {
      result.checks.redis = 'not_configured';
    }

    return result;
  }

  @Get('health/system')
  @ApiOperation({ summary: 'System status' })
  @ApiResponse({
    status: 200,
    description: 'System status information',
  })
  getSystemStatus() {
    return {
      status: 'ok',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    };
  }
}
