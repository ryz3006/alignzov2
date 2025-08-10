# AlignzoV2 - Technical Implementation Details

## 🔧 Core Implementation Patterns

### 1. Authentication & Authorization Implementation

#### 1.1 JWT Strategy Implementation
```typescript
// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: await this.getUserRoles(user.id),
    };
  }
}
```

#### 1.2 Permission Guard Implementation
```typescript
// src/common/guards/permission.guard.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return this.permissionService.hasPermissions(user, requiredPermissions);
  }
}
```

#### 1.3 Permission Decorator
```typescript
// src/auth/decorators/permissions.decorator.ts
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// Usage in controllers
@Get('users')
@RequirePermissions('users:read')
async getUsers() {
  return this.userService.findAll();
}
```

### 2. Database Implementation with Prisma

#### 2.1 Prisma Service Implementation
```typescript
// src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

#### 2.2 User Service with Optimized Queries
```typescript
// src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string, includeRelations = false) {
    const include = includeRelations ? {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      teams: {
        include: {
          team: true,
        },
      },
      organization: true,
    } : {};

    return this.prisma.user.findUnique({
      where: { id },
      include,
    });
  }

  async findByOrganization(organizationId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const { page = 1, limit = 20, search } = options;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

### 3. Caching Implementation

#### 3.1 Cache Service Implementation
```typescript
// src/common/services/cache.service.ts
@Injectable()
export class CacheService {
  constructor(
    private redis: Redis,
    private logger: LoggerService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
    }
  }

  async invalidateResource(resource: string): Promise<void> {
    await this.invalidatePattern(`${resource}:*`);
  }
}
```

#### 3.2 Caching Interceptor
```typescript
// src/common/interceptors/caching.interceptor.ts
@Injectable()
export class CachingInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(url, user);
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(async (response) => {
        // Cache for 15 minutes by default
        await this.cacheService.set(cacheKey, response, 900);
      }),
    );
  }

  private generateCacheKey(url: string, user: any): string {
    const userId = user?.userId || 'anonymous';
    return `cache:${userId}:${url}`;
  }
}
```

### 4. Real-time Communication Implementation

#### 4.1 WebSocket Gateway
```typescript
// src/websocket/websocket.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private userService: UserService,
    private logger: LoggerService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const user = await this.authenticateUser(token);
      if (!user) {
        client.disconnect();
        return;
      }

      // Join organization room for multi-tenant isolation
      await client.join(`org:${user.organizationId}`);
      
      // Join user's personal room
      await client.join(`user:${user.userId}`);

      this.logger.log(`User ${user.userId} connected to WebSocket`);
    } catch (error) {
      this.logger.error('WebSocket connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log('Client disconnected from WebSocket');
  }

  @SubscribeMessage('joinProject')
  async handleJoinProject(client: Socket, projectId: string) {
    const user = await this.getUserFromSocket(client);
    if (user) {
      await client.join(`project:${projectId}`);
      this.logger.log(`User ${user.userId} joined project ${projectId}`);
    }
  }

  @SubscribeMessage('leaveProject')
  async handleLeaveProject(client: Socket, projectId: string) {
    await client.leave(`project:${projectId}`);
  }

  // Emit real-time updates
  async emitToProject(projectId: string, event: string, data: any) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }

  async emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  async emitToOrganization(organizationId: string, event: string, data: any) {
    this.server.to(`org:${organizationId}`).emit(event, data);
  }
}
```

### 5. Time Tracking Implementation

#### 5.1 Time Session Service
```typescript
// src/time-sessions/time-sessions.service.ts
@Injectable()
export class TimeSessionsService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway,
    private logger: LoggerService,
  ) {}

  async startSession(userId: string, projectId: string, description?: string) {
    // Check for existing active session
    const activeSession = await this.prisma.timeSession.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (activeSession) {
      throw new BadRequestException('User already has an active time session');
    }

    const session = await this.prisma.timeSession.create({
      data: {
        userId,
        projectId,
        description,
        status: 'ACTIVE',
        startTime: new Date(),
      },
      include: {
        project: true,
        user: true,
      },
    });

    // Emit real-time update
    await this.websocketGateway.emitToProject(
      projectId,
      'timeSessionStarted',
      session,
    );

    this.logger.log(`Time session started for user ${userId} on project ${projectId}`);
    return session;
  }

  async stopSession(userId: string, sessionId: string) {
    const session = await this.prisma.timeSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'ACTIVE',
      },
      include: {
        project: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Active session not found');
    }

    const endTime = new Date();
    const duration = endTime.getTime() - session.startTime.getTime();

    const updatedSession = await this.prisma.timeSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endTime,
        duration,
      },
      include: {
        project: true,
        user: true,
      },
    });

    // Emit real-time update
    await this.websocketGateway.emitToProject(
      session.projectId,
      'timeSessionStopped',
      updatedSession,
    );

    this.logger.log(`Time session stopped for user ${userId}, duration: ${duration}ms`);
    return updatedSession;
  }

  async getActiveSessions(organizationId: string) {
    return this.prisma.timeSession.findMany({
      where: {
        status: 'ACTIVE',
        user: {
          organizationId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
```

### 6. Analytics Implementation

#### 6.1 Analytics Service
```typescript
// src/analytics/analytics.service.ts
@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getUserProductivity(userId: string, dateRange: {
    start: Date;
    end: Date;
  }) {
    const [workLogs, timeSessions] = await Promise.all([
      this.prisma.workLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        include: {
          project: true,
        },
      }),
      this.prisma.timeSession.findMany({
        where: {
          userId,
          startTime: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          status: 'COMPLETED',
        },
        include: {
          project: true,
        },
      }),
    ]);

    const totalWorkHours = timeSessions.reduce((sum, session) => {
      return sum + (session.duration || 0);
    }, 0) / (1000 * 60 * 60); // Convert to hours

    const projectsWorked = new Set([
      ...workLogs.map(log => log.projectId),
      ...timeSessions.map(session => session.projectId),
    ]).size;

    const averageSessionLength = timeSessions.length > 0
      ? timeSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / timeSessions.length
      : 0;

    return {
      totalWorkHours,
      projectsWorked,
      workLogsCount: workLogs.length,
      timeSessionsCount: timeSessions.length,
      averageSessionLength: averageSessionLength / (1000 * 60), // Convert to minutes
      workLogs,
      timeSessions,
    };
  }

  async getTeamAnalytics(teamId: string, dateRange: {
    start: Date;
    end: Date;
  }) {
    const teamMembers = await this.prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: true,
      },
    });

    const userIds = teamMembers.map(member => member.userId);

    const [workLogs, timeSessions] = await Promise.all([
      this.prisma.workLog.findMany({
        where: {
          userId: { in: userIds },
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          project: true,
        },
      }),
      this.prisma.timeSession.findMany({
        where: {
          userId: { in: userIds },
          startTime: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          status: 'COMPLETED',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          project: true,
        },
      }),
    ]);

    // Calculate team metrics
    const totalTeamHours = timeSessions.reduce((sum, session) => {
      return sum + (session.duration || 0);
    }, 0) / (1000 * 60 * 60);

    const userProductivity = teamMembers.map(member => {
      const userWorkLogs = workLogs.filter(log => log.userId === member.userId);
      const userTimeSessions = timeSessions.filter(session => session.userId === member.userId);
      
      const userHours = userTimeSessions.reduce((sum, session) => {
        return sum + (session.duration || 0);
      }, 0) / (1000 * 60 * 60);

      return {
        userId: member.userId,
        userName: `${member.user.firstName} ${member.user.lastName}`,
        workHours: userHours,
        workLogsCount: userWorkLogs.length,
        timeSessionsCount: userTimeSessions.length,
      };
    });

    return {
      totalTeamHours,
      teamSize: teamMembers.length,
      userProductivity,
      workLogs,
      timeSessions,
    };
  }
}
```

### 7. Audit Logging Implementation

#### 7.1 Audit Service
```typescript
// src/audit-logs/audit-logs.service.ts
@Injectable()
export class AuditLogsService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async log(auditData: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          userId: auditData.userId,
          action: auditData.action,
          resource: auditData.resource,
          resourceId: auditData.resourceId,
          details: auditData.details,
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent,
          timestamp: new Date(),
        },
      });

      this.logger.log(`Audit log created: ${auditData.action} on ${auditData.resource}`);
      return auditLog;
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.resource) where.resource = filters.resource;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: auditLogs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

### 8. Background Job Processing

#### 8.1 Job Queue Implementation
```typescript
// src/jobs/jobs.service.ts
@Injectable()
export class JobsService {
  constructor(
    private queue: Queue,
    private logger: LoggerService,
  ) {}

  async addEmailJob(data: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }) {
    await this.queue.add('send-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async addDataExportJob(data: {
    userId: string;
    organizationId: string;
    exportType: string;
    dateRange: { start: Date; end: Date };
  }) {
    await this.queue.add('export-data', data, {
      attempts: 2,
      timeout: 300000, // 5 minutes
    });
  }

  async addCleanupJob(data: {
    organizationId: string;
    olderThan: Date;
  }) {
    await this.queue.add('cleanup-old-data', data, {
      delay: 24 * 60 * 60 * 1000, // 24 hours delay
    });
  }
}
```

#### 8.2 Job Processors
```typescript
// src/jobs/processors/email.processor.ts
@Processor('send-email')
export class EmailProcessor {
  constructor(
    private emailService: EmailService,
    private logger: LoggerService,
  ) {}

  @Process()
  async handleEmail(job: Job) {
    const { to, subject, template, context } = job.data;
    
    try {
      await this.emailService.sendEmail(to, subject, template, context);
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}

// src/jobs/processors/data-export.processor.ts
@Processor('export-data')
export class DataExportProcessor {
  constructor(
    private exportService: ExportService,
    private logger: LoggerService,
  ) {}

  @Process()
  async handleDataExport(job: Job) {
    const { userId, organizationId, exportType, dateRange } = job.data;
    
    try {
      const exportResult = await this.exportService.exportData({
        userId,
        organizationId,
        exportType,
        dateRange,
      });
      
      this.logger.log(`Data export completed for user ${userId}`);
      return exportResult;
    } catch (error) {
      this.logger.error(`Data export failed for user ${userId}:`, error);
      throw error;
    }
  }
}
```

### 9. Error Handling Implementation

#### 9.1 Global Exception Filter
```typescript
// src/common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      success: false,
      error: {
        message: exception.message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
      meta: {
        requestId: request.headers['x-request-id'] || 'unknown',
      },
    };

    this.logger.error(
      `HTTP Exception: ${status} - ${exception.message}`,
      {
        url: request.url,
        method: request.method,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        userId: request.user?.userId,
      },
    );

    response.status(status).json(errorResponse);
  }
}
```

#### 9.2 Validation Pipe Configuration
```typescript
// src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors: ValidationError[]) => {
      const messages = errors.map(error => {
        const constraints = Object.values(error.constraints || {});
        return `${error.property}: ${constraints.join(', ')}`;
      });
      
      return new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    },
  }),
);
```

### 10. Configuration Management

#### 10.1 Environment Configuration
```typescript
// src/config/config.service.ts
@Injectable()
export class ConfigService {
  constructor() {
    this.validateEnvironment();
  }

  private validateEnvironment() {
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'REDIS_URL',
      'FIREBASE_PROJECT_ID',
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  get(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
  }

  getOptional(key: string): string | undefined {
    return process.env[key];
  }

  getNumber(key: string): number {
    const value = this.get(key);
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a number`);
    }
    return parsed;
  }

  getBoolean(key: string): boolean {
    const value = this.get(key);
    return value.toLowerCase() === 'true';
  }
}
```

This technical implementation document provides detailed code examples and patterns used throughout the AlignzoV2 system. Each section demonstrates the actual implementation approach used in the codebase, showing how the architectural decisions are translated into working code.
