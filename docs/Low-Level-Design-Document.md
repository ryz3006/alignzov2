# AlignzoV2 - Low Level Design Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Architecture](#api-architecture)
6. [Security Implementation](#security-implementation)
7. [Performance Optimization](#performance-optimization)
8. [Future-Proofing Methodologies](#future-proofing-methodologies)
9. [Deployment Architecture](#deployment-architecture)
10. [Monitoring & Observability](#monitoring--observability)

---

## 1. Project Overview

### 1.1 System Purpose
AlignzoV2 is an **Enterprise Team Productivity Platform** designed to provide comprehensive project management, time tracking, and team collaboration capabilities for multi-tenant organizations.

### 1.2 Core Functionalities
- **Multi-tenant Organization Management** - Complete data isolation per organization
- **Role-Based Access Control (RBAC)** - Granular permission system
- **Time Tracking & Work Logs** - Session-based time tracking with analytics
- **Project & Team Management** - Full lifecycle project management
- **User Management** - Hierarchical user structure with manager-subordinate relationships
- **Real-time Collaboration** - WebSocket-based real-time features
- **Analytics & Reporting** - Comprehensive productivity analytics
- **Audit & Compliance** - Complete activity logging and audit trails

### 1.3 Target Users
- **Enterprise Organizations** - Multi-department companies
- **Project Managers** - Team and project oversight
- **Team Members** - Daily productivity tracking
- **Administrators** - System configuration and user management

---

## 2. System Architecture

### 2.1 High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Redis Cache   │    │   Vector DB     │
│   Auth          │    │   Sessions      │    │   (Pinecone)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 Architecture Pattern
- **Monolithic with Microservices-Ready Design**
- **Modular Architecture** using NestJS modules
- **Event-Driven Architecture** for real-time features
- **CQRS Pattern** for complex queries and commands

### 2.3 Component Architecture

#### 2.3.1 Frontend Architecture (Next.js 15+)
```
src/
├── app/                    # App Router (Next.js 15)
│   ├── dashboard/         # Protected dashboard routes
│   ├── login/            # Authentication pages
│   └── layout.tsx        # Root layout
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── ui/              # Base UI components
├── lib/                 # Utilities and configurations
│   ├── auth-context.tsx # Authentication context
│   ├── permissions.tsx  # Permission management
│   └── providers.tsx    # React providers
└── hooks/               # Custom React hooks
```

#### 2.3.2 Backend Architecture (NestJS 10+)
```
src/
├── auth/                # Authentication module
├── users/              # User management
├── organizations/      # Organization management
├── teams/              # Team management
├── projects/           # Project management
├── work-logs/          # Work logging system
├── time-sessions/      # Time tracking
├── roles/              # Role management
├── permissions/        # Permission system
├── analytics/          # Analytics and reporting
├── audit-logs/         # Audit logging
├── common/             # Shared utilities
│   ├── guards/         # Authorization guards
│   ├── interceptors/   # Request/response interceptors
│   ├── filters/        # Exception filters
│   └── services/       # Shared services
└── config/             # Configuration management
```

---

## 3. Technology Stack

### 3.1 Frontend Technologies
| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| Next.js | 15+ | React framework | SSR, SSG, built-in optimizations |
| React | 19+ | UI library | Concurrent features, TypeScript support |
| TypeScript | 5+ | Type safety | Compile-time error catching |
| Tailwind CSS | 4+ | Styling | Utility-first, consistent design |
| React Query | 5+ | Data fetching | Caching, background updates |
| Zustand | Latest | State management | Lightweight, TypeScript support |
| React Hook Form | 7+ | Form handling | Performance, validation |
| Zod | Latest | Validation | Type-safe schema validation |

### 3.2 Backend Technologies
| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| Node.js | 20+ LTS | Runtime | JavaScript ecosystem, async handling |
| NestJS | 10+ | Framework | Enterprise architecture, DI |
| TypeScript | 5+ | Type safety | Type safety, tooling |
| PostgreSQL | 16+ | Database | ACID compliance, JSON support |
| Prisma | 6+ | ORM | Type-safe, migrations |
| Redis | 7+ | Cache | In-memory performance |
| Firebase Admin | 12+ | Auth | Google OAuth, secure tokens |
| Socket.io | 4+ | WebSockets | Real-time communication |
| BullMQ | 5+ | Job Queue | Background processing |

### 3.3 Infrastructure Technologies
| Technology | Purpose | Justification |
|------------|---------|---------------|
| Docker | Containerization | Consistent environments |
| Docker Compose | Local development | Multi-service orchestration |
| AWS | Cloud platform | Scalability, managed services |
| GitHub Actions | CI/CD | Automated deployment |
| Winston | Logging | Structured logging |
| Prometheus | Metrics | Performance monitoring |

---

## 4. Database Design

### 4.1 Database Schema Overview
The system uses **PostgreSQL 16+** with **Prisma ORM** for type-safe database access.

#### 4.1.1 Core Entity Relationships
```
User (1) ──── (N) Organization
User (1) ──── (N) TeamMember
User (1) ──── (N) ProjectMember
User (1) ──── (N) WorkLog
User (1) ──── (N) TimeSession

Organization (1) ──── (N) User
Organization (1) ──── (N) Project
Organization (1) ──── (N) Team

Project (1) ──── (N) WorkLog
Project (1) ──── (N) TimeSession
Project (1) ──── (N) ProjectMember

Team (1) ──── (N) TeamMember
Team (1) ──── (N) ProjectTeam
```

#### 4.1.2 Key Database Models

**User Model**
```sql
model User {
  id               String    @id @default(dbgenerated("gen_random_uuid()"))
  email            String    @unique
  firstName        String
  lastName         String
  displayName      String?
  organizationId   String?   @db.Uuid
  managerId        String?   @db.Uuid
  isActive         Boolean   @default(true)
  lastLoginAt      DateTime? @db.Timestamptz(6)
  createdAt        DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt        DateTime  @default(now()) @updatedAt @db.Timestamptz(6)
  
  // Relationships
  organization     Organization? @relation(fields: [organizationId], references: [id])
  manager          User?         @relation("UserHierarchy", fields: [managerId], references: [id])
  subordinates     User[]        @relation("UserHierarchy")
  workLogs         WorkLog[]
  timeSessions     TimeSession[]
  userRoles        UserRole[]
  userPermissions  UserPermission[]
}
```

**Organization Model**
```sql
model Organization {
  id          String   @id @default(dbgenerated("gen_random_uuid()"))
  name        String
  slug        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  
  // Relationships
  users       User[]
  projects    Project[]
  teams       Team[]
}
```

### 4.2 Database Optimizations

#### 4.2.1 Indexing Strategy
```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);

-- Project indexes
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Work log indexes
CREATE INDEX idx_work_logs_user_id ON work_logs(user_id);
CREATE INDEX idx_work_logs_project_id ON work_logs(project_id);
CREATE INDEX idx_work_logs_created_at ON work_logs(created_at);

-- Time session indexes
CREATE INDEX idx_time_sessions_user_id ON time_sessions(user_id);
CREATE INDEX idx_time_sessions_status ON time_sessions(status);
```

#### 4.2.2 Partitioning Strategy
- **Time-based partitioning** for audit logs and work logs
- **Organization-based partitioning** for multi-tenant data isolation

### 4.3 Caching Strategy

#### 4.3.1 Redis Cache Layers
```typescript
// Cache service implementation
export class CacheService {
  // User permissions cache (TTL: 1 hour)
  async cacheUserPermissions(userId: string, permissions: Permission[]) {
    await this.redis.setex(`user:${userId}:permissions`, 3600, JSON.stringify(permissions));
  }
  
  // Organization settings cache (TTL: 24 hours)
  async cacheOrganizationSettings(orgId: string, settings: any) {
    await this.redis.setex(`org:${orgId}:settings`, 86400, JSON.stringify(settings));
  }
  
  // Query results cache (TTL: 15 minutes)
  async cacheQueryResult(key: string, result: any) {
    await this.redis.setex(`query:${key}`, 900, JSON.stringify(result));
  }
}
```

---

## 5. API Architecture

### 5.1 RESTful API Design

#### 5.1.1 API Structure
```
/api/v1/
├── auth/              # Authentication endpoints
├── users/             # User management
├── organizations/     # Organization management
├── teams/             # Team management
├── projects/          # Project management
├── work-logs/         # Work logging
├── time-sessions/     # Time tracking
├── roles/             # Role management
├── permissions/       # Permission management
├── analytics/         # Analytics and reporting
└── audit-logs/        # Audit logging
```

#### 5.1.2 Standard Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 5.2 API Security

#### 5.2.1 Authentication Flow
```typescript
// JWT Strategy implementation
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      roles: payload.roles,
    };
  }
}
```

#### 5.2.2 Authorization Guards
```typescript
// Permission guard implementation
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

    return this.permissionService.hasPermissions(user, requiredPermissions);
  }
}
```

### 5.3 API Rate Limiting
```typescript
// Rate limiting configuration
ThrottlerModule.forRoot([
  {
    ttl: 60_000,        // 1 minute
    limit: 100,         // 100 requests per minute
  },
  {
    ttl: 3600_000,      // 1 hour
    limit: 1000,        // 1000 requests per hour
  },
])
```

---

## 6. Security Implementation

### 6.1 Multi-Layer Security Architecture

#### 6.1.1 Transport Security
```typescript
// Helmet security headers
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
```

#### 6.1.2 Input Validation
```typescript
// Zod schema validation
export const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  organizationId: z.string().uuid().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});

// Validation pipe configuration
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### 6.2 Access Control Model

#### 6.2.1 Role Hierarchy
```
SUPER_ADMIN
├── Full system access
├── User management
├── System configuration
└── Audit access

ADMIN
├── Organization management
├── Team management
├── Project management
└── User management (limited)

MANAGER
├── Team management
├── Project management
├── Work log approval
└── Team analytics

USER
├── Personal work logs
├── Time tracking
├── Project access (assigned)
└── Team collaboration
```

#### 6.2.2 Permission System
```typescript
// Permission service implementation
@Injectable()
export class PermissionService {
  async hasPermissions(user: User, requiredPermissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(user.id);
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    // Check cache first
    const cached = await this.cacheService.get(`user:${userId}:permissions`);
    if (cached) return JSON.parse(cached);

    // Fetch from database
    const permissions = await this.fetchUserPermissionsFromDB(userId);
    
    // Cache for 1 hour
    await this.cacheService.set(`user:${userId}:permissions`, JSON.stringify(permissions), 3600);
    
    return permissions;
  }
}
```

### 6.3 Data Protection

#### 6.3.1 Audit Logging
```typescript
// Audit interceptor implementation
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { method, url, body } = request;

    // Log the action
    await this.auditService.log({
      userId: user?.id,
      action: `${method} ${url}`,
      resource: this.getResourceFromUrl(url),
      details: body,
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
    });

    return next.handle();
  }
}
```

---

## 7. Performance Optimization

### 7.1 Frontend Performance

#### 7.1.1 Next.js Optimizations
```typescript
// Next.js configuration
const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  compress: true,
  poweredByHeader: false,
};
```

#### 7.1.2 React Query Caching
```typescript
// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 7.2 Backend Performance

#### 7.2.1 Database Query Optimization
```typescript
// Optimized query with includes
async findUsersWithDetails(organizationId: string) {
  return this.prisma.user.findMany({
    where: { organizationId },
    include: {
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
    },
  });
}
```

#### 7.2.2 Caching Strategy
```typescript
// Cache invalidation interceptor
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Invalidate cache on write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const resource = this.getResourceFromUrl(url);
      await this.cacheService.invalidateResource(resource);
    }

    return next.handle();
  }
}
```

### 7.3 Performance Targets
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 50ms (average)
- **Frontend Load Time**: < 2s (initial load)
- **Concurrent Users**: 10,000+
- **Uptime**: 99.9%

---

## 8. Future-Proofing Methodologies

### 8.1 Microservices Migration Path

#### 8.1.1 Current State: Modular Monolith
```
Current Architecture:
┌─────────────────────────────────────┐
│           NestJS Monolith           │
├─────────────────────────────────────┤
│  Auth Module  │  User Module       │
│  Team Module  │  Project Module    │
│  Work Module  │  Analytics Module  │
└─────────────────────────────────────┘
```

#### 8.1.2 Migration Strategy
```
Phase 1: Modular Monolith (Current)
├── Clear module boundaries
├── Shared database
└── Internal module communication

Phase 2: Extract Authentication Service
├── Separate auth service
├── JWT token validation
└── API gateway integration

Phase 3: Extract User Management Service
├── User CRUD operations
├── Organization management
└── Role/permission management

Phase 4: Extract Work Management Service
├── Work logs
├── Time tracking
└── Project management

Phase 5: Extract Analytics Service
├── Reporting engine
├── Data aggregation
└── Real-time analytics

Final: Fully Distributed Microservices
├── Service mesh
├── Event-driven architecture
└── Independent deployments
```

### 8.2 AI/ML Integration Architecture

#### 8.2.1 Vector Database Integration
```typescript
// Vector database service
@Injectable()
export class VectorDatabaseService {
  async storeDocumentEmbedding(documentId: string, embedding: number[]) {
    await this.pinecone.upsert({
      vectors: [{
        id: documentId,
        values: embedding,
        metadata: { type: 'document' }
      }]
    });
  }

  async searchSimilarDocuments(query: string, limit: number = 10) {
    const queryEmbedding = await this.generateEmbedding(query);
    return this.pinecone.query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true
    });
  }
}
```

#### 8.2.2 LLM Integration
```typescript
// LLM service for RAG applications
@Injectable()
export class LLMService {
  async generateResponse(context: string, query: string) {
    const prompt = `
      Context: ${context}
      Question: ${query}
      Answer:`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  }
}
```

### 8.3 Mobile Application Architecture

#### 8.3.1 React Native Integration
```typescript
// Mobile API gateway
@Controller('mobile')
export class MobileController {
  @Get('sync')
  async syncData(@User() user: User) {
    // Optimized endpoints for mobile
    const lastSync = await this.getLastSyncTime(user.id);
    
    return {
      workLogs: await this.getWorkLogsSince(user.id, lastSync),
      timeSessions: await this.getTimeSessionsSince(user.id, lastSync),
      projects: await this.getUserProjects(user.id),
    };
  }

  @Post('offline-sync')
  async syncOfflineData(@User() user: User, @Body() data: any) {
    // Handle offline data synchronization
    return this.handleOfflineSync(user.id, data);
  }
}
```

### 8.4 Event-Driven Architecture

#### 8.4.1 Event Bus Implementation
```typescript
// Event bus service
@Injectable()
export class EventBusService {
  async publish(event: DomainEvent) {
    // Publish to Redis pub/sub
    await this.redis.publish('events', JSON.stringify(event));
    
    // Store in event store for replay
    await this.eventStore.append(event);
  }

  async subscribe(eventType: string, handler: EventHandler) {
    this.redis.subscribe('events', (message) => {
      const event = JSON.parse(message);
      if (event.type === eventType) {
        handler.handle(event);
      }
    });
  }
}
```

---

## 9. Deployment Architecture

### 9.1 Containerization Strategy

#### 9.1.1 Docker Configuration
```dockerfile
# Backend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/src/main"]
```

#### 9.1.2 Docker Compose Setup
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: alignzo
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/alignzo
      REDIS_URL: redis://redis:6379

  frontend:
    build: ./frontend
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
```

### 9.2 Cloud Infrastructure (AWS)

#### 9.2.1 Infrastructure as Code
```yaml
# AWS CloudFormation template
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: postgres
      DBInstanceClass: db.t3.micro
      AllocatedStorage: 20
      MasterUsername: postgres
      MasterUserPassword: !Ref DBPassword

  ElastiCacheCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      Engine: redis
      CacheNodeType: cache.t3.micro
      NumCacheNodes: 1
```

### 9.3 CI/CD Pipeline

#### 9.3.1 GitHub Actions Workflow
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd backend && npm test
          cd frontend && npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t alignzo-backend ./backend
          docker build -t alignzo-frontend ./frontend

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: |
          # Deploy to ECS/EKS
          aws ecs update-service --cluster alignzo --service backend
```

---

## 10. Monitoring & Observability

### 10.1 Logging Strategy

#### 10.1.1 Structured Logging
```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'alignzo-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

#### 10.1.2 Request Logging
```typescript
// Logging middleware
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    });
    
    next();
  }
}
```

### 10.2 Metrics Collection

#### 10.2.1 Prometheus Metrics
```typescript
// Metrics service
@Injectable()
export class MetricsService {
  private httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
  });

  private activeUsers = new prometheus.Gauge({
    name: 'active_users_total',
    help: 'Total number of active users',
  });

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration / 1000);
  }

  setActiveUsers(count: number) {
    this.activeUsers.set(count);
  }
}
```

### 10.3 Health Checks

#### 10.3.1 Health Check Endpoints
```typescript
@Controller('health')
export class HealthController {
  @Get()
  async check() {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      external: await this.checkExternalServices(),
    };

    const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}
```

### 10.4 Alerting Strategy

#### 10.4.1 Alert Rules
```yaml
# Prometheus alert rules
groups:
  - name: alignzo_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: DatabaseConnectionFailing
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Database connection is down
```

---

## Conclusion

AlignzoV2 is designed as a **modern, scalable enterprise platform** with a focus on:

1. **Modular Architecture** - Easy to maintain and extend
2. **Security First** - Multi-layer security with RBAC
3. **Performance Optimized** - Caching, indexing, and optimization strategies
4. **Future-Proof** - Microservices-ready with AI/ML integration capabilities
5. **Production Ready** - Comprehensive monitoring, logging, and deployment strategies

The system provides a solid foundation for enterprise team productivity while maintaining flexibility for future enhancements and scalability requirements.
