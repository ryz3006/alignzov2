import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.APP_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? (['query', 'info', 'warn', 'error'] as const)
          : (['error'] as const),
      errorFormat: 'pretty' as const,
    });
  }

  async onModuleInit() {
    // Skip database connection during startup to prevent hanging
    // The connection will be established on first use
    console.log('PrismaService: Skipping connection during startup for faster boot');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
