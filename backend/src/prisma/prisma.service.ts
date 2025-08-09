import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    console.log('PrismaService constructor called');
    try {
      console.log('Initializing Prisma client...');
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
        // Add connection timeout to prevent hanging
        __internal: {
          engine: {
            enableRawQueries: true,
          },
        },
      });
      console.log('Prisma client initialized successfully');
    } catch (error) {
      console.error('Prisma client initialization failed:', error?.message);
      console.error('Error stack:', error?.stack);
      throw error;
    }
  }

  async onModuleInit() {
    console.log('PrismaService.onModuleInit() called');
    console.log('Attempting database connection...');
    try {
      console.log('Calling this.$connect()...');
      await this.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('DATABASE_URL format check:', process.env.DATABASE_URL?.substring(0, 20) + '...');
      // Don't throw - let the app start and handle DB errors per request
      console.warn('Starting app without database connection - will retry per request');
    }
    console.log('PrismaService.onModuleInit() completed');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
