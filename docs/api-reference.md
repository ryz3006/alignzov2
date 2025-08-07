# 📖 API Reference

Complete API documentation for Alignzo platform.

---

## 🎯 API Design Philosophy

### Core Principles

#### 1. RESTful Architecture with OpenAPI 3.0
We adopt REST as our primary API architectural pattern, enhanced with OpenAPI 3.0 specification for comprehensive documentation and code generation.

**Justification:**
- **Industry Standard**: REST is widely understood and adopted
- **Tooling Ecosystem**: Excellent tooling for testing, documentation, and client generation
- **Caching**: HTTP caching mechanisms work naturally with REST
- **Stateless**: Inherently scalable and reliable
- **HTTP Semantics**: Leverages HTTP methods and status codes effectively

#### 2. API-First Development
Every feature must be designed as an API first, then the UI consumes these APIs.

**Benefits:**
- **Consistency**: Same APIs power web, mobile, and third-party integrations
- **Testing**: APIs can be thoroughly tested independently
- **Integration**: Third-party tools and future AI agents can seamlessly integrate
- **Performance**: Optimized data fetching and caching strategies

#### 3. Security-First Design
Every endpoint implements comprehensive security from day one.

**Security Layers:**
- **Authentication**: Firebase JWT tokens
- **Authorization**: Role-based and attribute-based access control
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **Input Validation**: Comprehensive request validation using Zod schemas
- **Audit Logging**: Track all API usage for compliance

---

## 📋 API Response Standards

### Success Response Format
```json
{
  "success": true,
  "data": {
    // Actual response data
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789",
    "version": "v1"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789",
    "version": "v1"
  }
}
```

### HTTP Status Codes
- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Client error, validation failure
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (duplicate, concurrency)
- **422 Unprocessable Entity**: Business logic validation failure
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

---

## 🔗 URL Structure and Naming Conventions

### Base URL Structure
```
https://api.alignzo.com/v1
```

### Resource Naming
- Use plural nouns for collections: `/users`, `/projects`, `/work-logs`
- Use kebab-case for multi-word resources: `/time-sessions`, `/project-members`
- Use nested resources for relationships: `/projects/{id}/members`

### Endpoint Patterns
```
GET    /api/v1/users                    # List users
GET    /api/v1/users/{id}               # Get specific user
POST   /api/v1/users                    # Create user
PUT    /api/v1/users/{id}               # Replace user
PATCH  /api/v1/users/{id}               # Update user
DELETE /api/v1/users/{id}               # Delete user

GET    /api/v1/projects/{id}/members    # List project members
POST   /api/v1/projects/{id}/members    # Add project member
DELETE /api/v1/projects/{id}/members/{userId} # Remove project member
```

---

## 🔐 Authentication

### Firebase JWT Authentication
All API endpoints require authentication using Firebase JWT tokens.

#### Authentication Flow
1. **Client obtains Firebase ID token** from Firebase Auth
2. **Client sends token** in Authorization header
3. **Server validates token** using Firebase Admin SDK
4. **Server creates session** and returns custom JWT
5. **Client uses custom JWT** for subsequent requests

#### Headers
```http
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

#### Example Request
```bash
curl -X POST http://localhost:3001/api/auth/login/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "firebase_id_token_here"}'
```

---

## 📊 Pagination Strategy

### Cursor-Based Pagination (Recommended)
For real-time data and large datasets:
```
GET /api/v1/work-logs?cursor=eyJ0aW1lc3RhbXAiOiIyMDI0LTAxLTE1VDA5OjAwOjAwWiIsImlkIjoiMTIzIn0&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJ0aW1lc3RhbXAiOiIyMDI0LTAxLTE1VDA5OjMwOjAwWiIsImlkIjoiMTQ1In0",
    "prevCursor": "eyJ0aW1lc3RhbXAiOiIyMDI0LTAxLTE1VDA4OjMwOjAwWiIsImlkIjoiMTAxIn0",
    "hasNext": true,
    "hasPrev": true,
    "limit": 20
  }
}
```

### Offset-Based Pagination
For admin interfaces and reports:
```
GET /api/v1/users?page=2&limit=20
```

---

## 🔍 Filtering and Searching

### Query Parameters
```
GET /api/v1/work-logs?userId=123&projectId=456&startDate=2024-01-01&endDate=2024-01-31&isBillable=true&tags=development,frontend&search=bug fix&sort=-startTime,duration
```

### Advanced Filtering (Future)
Support JSON query parameters for complex filters:
```
GET /api/v1/work-logs?filter={"and":[{"userId":"123"},{"or":[{"projectId":"456"},{"projectId":"789"}]}]}
```

---

## 🚀 Available Endpoints

### Health & System Endpoints

#### Get Application Health
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "uptime": 3600
  }
}
```

#### Get Database Health
```http
GET /api/health/db
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "responseTime": 45,
    "activeConnections": 5,
    "database": "alignzo_v2"
  }
}
```

#### Get System Status
```http
GET /api/health/system
```

**Response:**
```json
{
  "success": true,
  "data": {
    "database": "connected",
    "redis": "connected",
    "firebase": "optional",
    "memory": {
      "used": "512MB",
      "total": "2GB"
    },
    "cpu": {
      "usage": "15%"
    }
  }
}
```

---

### Authentication Endpoints

#### Google OAuth Login
```http
POST /api/auth/login/google
```

**Request Body:**
```json
{
  "idToken": "firebase_id_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["USER"]
    }
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### Logout User
```http
POST /api/auth/logout
```

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

#### Get Current User
```http
GET /api/auth/me
```

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["USER"],
    "permissions": ["work_log.create", "work_log.read"],
    "organization": {
      "id": "org_456",
      "name": "Example Corp"
    }
  }
}
```

---

### User Management Endpoints

#### List Users
```http
GET /api/users?page=1&limit=20&search=john&role=USER
```

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page (max 100)
- `search` (string): Search by name or email
- `role` (string): Filter by role
- `status` (string): Filter by status (active/inactive)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["USER"],
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### Get User by ID
```http
GET /api/users/{userId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["USER"],
    "status": "active",
    "manager": {
      "id": "user_456",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "subordinates": [
      {
        "id": "user_789",
        "firstName": "Bob",
        "lastName": "Johnson"
      }
    ],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Create User
```http
POST /api/users
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "roleId": "role_123",
  "managerId": "user_456",
  "teamIds": ["team_123", "team_456"],
  "projectAssignments": [
    {
      "projectId": "project_123",
      "reportingToId": "user_789"
    },
    {
      "projectId": "project_456",
      "reportingToId": "user_101"
    }
  ]
}
```

#### Update User
```http
PATCH /api/users/{userId}
```

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "roleIds": ["role_123", "role_456"]
}
```

#### Delete User
```http
DELETE /api/users/{userId}
```

#### Search Users
```http
GET /api/users/search?q=john&limit=10
```

#### Get User Subordinates
```http
GET /api/users/subordinates
```

---

### Team Management Endpoints

#### List Teams
```http
GET /api/teams?page=1&limit=20&search=development
```

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page (max 100)
- `search` (string): Search by team name or description
- `leaderId` (string): Filter by team leader

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "team_123",
      "name": "Development Team",
      "description": "Core development team",
      "leader": {
        "id": "user_123",
        "firstName": "John",
        "lastName": "Doe"
      },
      "memberCount": 5,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

#### Get Team by ID
```http
GET /api/teams/{teamId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "team_123",
    "name": "Development Team",
    "description": "Core development team",
    "leader": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe"
    },
    "members": [
      {
        "id": "user_456",
        "firstName": "Jane",
        "lastName": "Smith",
        "joinedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Create Team
```http
POST /api/teams
```

**Request Body:**
```json
{
  "name": "New Team",
  "description": "Team description",
  "leaderId": "user_123",
  "memberIds": ["user_456", "user_789"]
}
```

#### Update Team
```http
PATCH /api/teams/{teamId}
```

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "description": "Updated description",
  "leaderId": "user_456"
}
```

#### Delete Team
```http
DELETE /api/teams/{teamId}
```

---

### Project Management Endpoints

#### List Projects
```http
GET /api/projects?page=1&limit=20&search=website&status=ACTIVE
```

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page (max 100)
- `search` (string): Search by project name, code, or client
- `status` (string): Filter by project status (ACTIVE, COMPLETED, ON_HOLD, CANCELLED)
- `priority` (string): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `ownerId` (string): Filter by project owner

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "project_123",
      "name": "Website Redesign",
      "code": "WEB-2024-001",
      "description": "Complete website redesign project",
      "client": "ABC Company",
      "status": "ACTIVE",
      "priority": "HIGH",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-06-30T00:00:00Z",
      "budget": "50000.00",
      "owner": {
        "id": "user_123",
        "firstName": "John",
        "lastName": "Doe"
      },
      "teamCount": 3,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

#### Get Project by ID
```http
GET /api/projects/{projectId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "project_123",
    "name": "Website Redesign",
    "code": "WEB-2024-001",
    "description": "Complete website redesign project",
    "client": "ABC Company",
    "status": "ACTIVE",
    "priority": "HIGH",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-06-30T00:00:00Z",
    "budget": "50000.00",
    "owner": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe"
    },
    "teams": [
      {
        "id": "team_123",
        "name": "Development Team",
        "joinedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "members": [
      {
        "id": "user_456",
        "firstName": "Jane",
        "lastName": "Smith",
        "reportingTo": {
          "id": "user_123",
          "firstName": "John",
          "lastName": "Doe"
        },
        "joinedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Create Project
```http
POST /api/projects
```

**Request Body:**
```json
{
  "name": "New Project",
  "code": "PROJ-2024-001",
  "description": "Project description",
  "client": "Client Name",
  "status": "ACTIVE",
  "priority": "MEDIUM",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T00:00:00Z",
  "budget": "25000.00",
  "ownerId": "user_123",
  "teamIds": ["team_123", "team_456"]
}
```

#### Update Project
```http
PATCH /api/projects/{projectId}
```

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "status": "COMPLETED",
  "priority": "HIGH"
}
```

#### Delete Project
```http
DELETE /api/projects/{projectId}
```

---

## 🚨 Error Handling

### Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "startTime",
        "message": "Start time cannot be in the future"
      },
      {
        "field": "duration",
        "message": "Duration must be greater than 0"
      }
    ]
  }
}
```

### Business Logic Errors
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to access this project",
    "details": {
      "requiredPermission": "project.read",
      "currentRole": "viewer",
      "projectId": "proj_789"
    }
  }
}
```

### Rate Limit Errors
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 1000,
      "remaining": 0,
      "resetTime": "2024-01-15T15:00:00Z"
    }
  }
}
```

---

## 🔒 Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
X-RateLimit-Retry-After: 60
```

### Rate Limit Tiers
- **Public APIs**: 100 requests/minute
- **Authenticated Users**: 1000 requests/minute
- **Premium Users**: 5000 requests/minute
- **Integrations**: 10000 requests/minute

---

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:3001/api/docs
- **OpenAPI Spec**: http://localhost:3001/api/docs-json

### Code Generation
```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3001/api/docs-json \
  -g typescript-fetch \
  -o ./generated-client
```

---

## 🧪 Testing APIs

### Using curl
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test authentication
curl -X POST http://localhost:3001/api/auth/login/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your_firebase_token"}'

# Test authenticated endpoint
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer your_jwt_token"
```

### Using Postman
1. **Import OpenAPI spec**: http://localhost:3001/api/docs-json
2. **Set up environment variables**:
   - `baseUrl`: http://localhost:3001/api
   - `token`: Your JWT token
3. **Use pre-request scripts** to automatically add Authorization header

### Using Swagger UI
1. Visit http://localhost:3001/api/docs
2. Click "Authorize" and enter your JWT token
3. Test endpoints directly in the browser

---

## 🔄 API Versioning

### Version Strategy
- **URL Versioning**: `/api/v1/users`, `/api/v2/users`
- **Major versions only**: v1, v2, v3
- **Backward compatibility**: Within major versions
- **Deprecation notice**: 12-month notice before removing old versions

### Version Lifecycle
- **v1**: Current stable version
- **v2**: Next major version (breaking changes)
- **Deprecation**: 12-month notice before removing old versions

---

## 🚨 Troubleshooting

### Common Issues

#### 401 Unauthorized
- Check if JWT token is valid and not expired
- Verify Firebase ID token is correct
- Ensure Authorization header is properly formatted

#### 403 Forbidden
- Check user permissions for the requested resource
- Verify user role has required access level
- Check if resource belongs to user's organization

#### 429 Too Many Requests
- Implement exponential backoff
- Check rate limit headers for reset time
- Consider upgrading to higher rate limit tier

#### 500 Internal Server Error
- Check server logs for detailed error information
- Verify database connection is healthy
- Check if all required services are running

### Debug Headers
```http
X-Request-ID: req_123456789
X-Response-Time: 45ms
X-Cache-Hit: false
```

---

## 📞 Support

### Getting Help
- **Interactive API Docs**: http://localhost:3001/api/docs
- **Health Checks**: http://localhost:3001/api/health
- **Development Guide**: [Complete workflow](./development-guide.md)
- **Architecture**: [System design](./architecture.md)

### API Status
- **Development**: http://localhost:3001/api/health
- **Staging**: https://staging-api.alignzo.com/api/health
- **Production**: https://api.alignzo.com/api/health

---

*This API reference provides comprehensive documentation for all Alignzo endpoints. For interactive testing, visit the Swagger UI at http://localhost:3001/api/docs.* 