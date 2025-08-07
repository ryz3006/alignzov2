// Database Configuration for Alignzo
// PostgreSQL connection and configuration management

import { PrismaClient } from '@prisma/client';

// Database configuration interface
export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  pool: {
    min: number;
    max: number;
    timeout: number;
  };
  ssl?: boolean;
  logging?: boolean;
}

// Get database configuration from environment variables
export const getDatabaseConfig = (): DatabaseConfig => {
  return {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/alignzo_v2?schema=public',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'alignzo_v2',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      timeout: parseInt(process.env.DB_TIMEOUT || '30000', 10),
    },
    ssl: process.env.NODE_ENV === 'production',
    logging: process.env.NODE_ENV === 'development',
  };
};

// Get application database configuration (for runtime)
export const getAppDatabaseConfig = (): DatabaseConfig => {
  return {
    url: process.env.APP_DATABASE_URL || 'postgresql://alignzo:alignzo@localhost:5432/alignzo_v2?schema=public',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.APP_DB_USERNAME || 'alignzo',
    password: process.env.APP_DB_PASSWORD || 'alignzo',
    database: process.env.DB_NAME || 'alignzo_v2',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      timeout: parseInt(process.env.DB_TIMEOUT || '30000', 10),
    },
    ssl: process.env.NODE_ENV === 'production',
    logging: process.env.NODE_ENV === 'development',
  };
};

// Prisma client configuration
export const prismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/alignzo_v2?schema=public',
    },
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] as any
    : ['error'] as any,
  errorFormat: 'pretty' as const,
};

// Application Prisma client configuration
export const appPrismaConfig = {
  datasources: {
    db: {
      url: process.env.APP_DATABASE_URL || 'postgresql://alignzo:alignzo@localhost:5432/alignzo_v2?schema=public',
    },
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] as any
    : ['error'] as any,
  errorFormat: 'pretty' as const,
};

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create or reuse Prisma client
export const createPrismaClient = (): PrismaClient => {
  const prisma = new PrismaClient({
    log: prismaConfig.log,
    errorFormat: prismaConfig.errorFormat,
  });

  // Add middleware for logging and performance monitoring
  if (process.env.NODE_ENV === 'development') {
    prisma.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      
      console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
      return result;
    });
  }

  return prisma;
};

// Get Prisma client instance (singleton pattern)
export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database connection test
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Database health check
export const getDatabaseHealth = async () => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    // Get database info
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        version() as version,
        current_database() as database,
        current_user as user,
        inet_server_addr() as host,
        inet_server_port() as port
    ` as any[];

    // Get connection info
    const connectionInfo = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    ` as any[];

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      database: dbInfo[0],
      connections: connectionInfo[0],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Database migration status
export const getMigrationStatus = async () => {
  try {
    const migrations = await prisma.$queryRaw`
      SELECT 
        migration_name,
        started_at,
        finished_at,
        logs
      FROM _prisma_migrations 
      ORDER BY started_at DESC 
      LIMIT 10
    ` as any[];

    return {
      status: 'success',
      migrations,
      totalMigrations: migrations.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
    };
  }
};

// Database cleanup function
export const cleanupDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Database seeding functions
export const isDatabaseEmpty = async (): Promise<boolean> => {
  try {
    const userCount = await prisma.user.count();
    return userCount === 0;
  } catch (error) {
    console.error('Error checking database state:', error);
    return false;
  }
};

// Transaction helper
export const executeTransaction = async <T>(
  operations: (prisma: PrismaClient) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(async (tx) => {
    return await operations(tx as PrismaClient);
  });
};

// Query performance monitoring
export const enableQueryLogging = (): void => {
  if (process.env.NODE_ENV === 'development') {
    prisma.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const duration = Date.now() - start;
      
      if (duration > 1000) { // Log slow queries (>1s)
        console.warn(`🐌 Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
      }
      
      return result;
    });
  }
};

// Error handling middleware
export const enableErrorHandling = (): void => {
  prisma.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      console.error(`Database error in ${params.model}.${params.action}:`, error);
      throw error;
    }
  });
};

// Initialize database configuration
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Initializing database connection...');
    
    // Test connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Enable monitoring in development
    if (process.env.NODE_ENV === 'development') {
      enableQueryLogging();
      enableErrorHandling();
    }
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Export default Prisma client
export default prisma;