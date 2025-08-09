# 🔒 AlignzoV2 Security Guide

**Version**: 2.0  
**Last Updated**: January 2025  
**Classification**: Internal Use

---

## 🛡️ Security Overview

AlignzoV2 implements a comprehensive multi-layer security architecture designed for enterprise environments with sensitive data handling requirements.

---

## 🔐 Authentication Architecture

### Firebase + JWT Dual Token System

```
User Login → Google OAuth → Firebase ID Token → Backend Verification → Custom JWT → API Access
```

#### Authentication Flow
1. **User initiates login** via Google OAuth
2. **Firebase returns ID token** with user claims
3. **Backend validates Firebase token** using Admin SDK
4. **Backend creates custom JWT** with application-specific claims
5. **Client uses custom JWT** for all subsequent API calls

#### Token Security
- **Firebase ID Tokens**: Short-lived (1 hour), cryptographically signed
- **Custom JWTs**: Application-specific claims, controlled expiration
- **Refresh Tokens**: Secure rotation with reuse detection
- **Token Storage**: HttpOnly cookies for sensitive tokens

---

## 🏢 Multi-Tenant Security

### Organization Isolation

#### Data Separation
- **Database Level**: All entities scoped to organizationId
- **API Level**: Automatic organization filtering
- **User Level**: Domain-based organization assignment
- **Access Control**: Complete data isolation between organizations

#### Domain Validation
```typescript
// Organization domain validation
const userDomain = email.split('@')[1];
const organization = await findOrganizationByDomain(userDomain);
if (!organization) {
  throw new UnauthorizedException('Domain not authorized');
}
```

---

## 👤 Role-Based Access Control (RBAC)

### Role Hierarchy
```
SUPER_ADMIN
├── Full system access
├── Multi-organization management
└── System configuration

ADMIN
├── Organization management
├── User management
└── Project management

MANAGER
├── Team management
├── Project oversight
└── Work log approval

USER
├── Personal work logs
├── Time tracking
└── Assigned project access
```

### Permission System
- **Granular Permissions**: Resource-action based (e.g., `users.create`, `projects.read`)
- **Permission Inheritance**: Role-based permission aggregation
- **Dynamic Validation**: Real-time permission checking
- **Scope-based Access**: Project/team-specific permissions

---

## 🔒 API Security

### Request Security

#### Authentication Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Organization-ID: <org_uuid>
```

#### Input Validation
- **Schema Validation**: Zod schemas for TypeScript safety
- **Class Validation**: NestJS class-validator decorators
- **Sanitization**: Input cleaning and normalization
- **Type Safety**: End-to-end TypeScript validation

#### Rate Limiting
```typescript
// Tiered rate limiting
Public APIs: 100 requests/minute
Authenticated Users: 1000 requests/minute
Premium Users: 5000 requests/minute
Integrations: 10000 requests/minute
```

### CORS Protection
```typescript
// Environment-specific CORS
Development: localhost:3000, localhost:3002
Staging: staging.alignzo.com
Production: app.alignzo.com
```

---

## 🛡️ Data Protection

### Database Security

#### Connection Security
- **Encrypted Connections**: TLS 1.3 for database connections
- **Connection Pooling**: Secure connection management
- **Credential Management**: Environment-based secrets
- **Access Control**: Database-level user permissions

#### Query Protection
- **Parameterized Queries**: Prisma ORM prevents SQL injection
- **Input Sanitization**: All inputs validated and cleaned
- **Query Monitoring**: Slow query detection and optimization
- **Audit Logging**: All database modifications logged

### Data Encryption
- **At Rest**: Database encryption for sensitive fields
- **In Transit**: TLS 1.3 for all API communications
- **Application Level**: Bcrypt for password hashing
- **Key Management**: Secure key rotation and storage

---

## 📊 Audit & Compliance

### Audit Logging System

#### Automatic Audit Trails
```typescript
@Audit('User Management')
@Post('users')
async createUser(@Body() userData) {
  // Automatically logs: user, action, timestamp, IP, changes
}
```

#### Audit Data Captured
- **User Actions**: All CRUD operations
- **Authentication Events**: Login, logout, failed attempts
- **Permission Changes**: Role/permission modifications
- **Data Access**: Sensitive data access patterns
- **System Events**: Configuration changes, errors

#### Compliance Features
- **Immutable Logs**: Append-only audit trail
- **Data Retention**: Configurable retention policies
- **Export Capabilities**: Audit data export for compliance
- **Integrity Verification**: Hash-based log verification

---

## 🚨 Security Monitoring

### Real-time Security Monitoring

#### Threat Detection
- **Failed Authentication**: Multiple failed login attempts
- **Suspicious Patterns**: Unusual access patterns
- **Rate Limit Violations**: API abuse detection
- **Permission Escalation**: Unauthorized access attempts

#### Security Headers
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### Incident Response
- **Automated Alerts**: Critical security event notifications
- **Log Analysis**: Centralized security log aggregation
- **Response Procedures**: Defined incident response workflows
- **Recovery Plans**: Security incident recovery procedures

---

## 🔧 Security Configuration

### Environment Security

#### Development Environment
```bash
# Secure defaults for development
JWT_SECRET=development-secret-change-in-production
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=1000
```

#### Production Environment
```bash
# Production security configuration
JWT_SECRET=<256-bit-random-secret>
CORS_ORIGIN=https://app.alignzo.com
RATE_LIMIT_MAX=100
HTTPS_ONLY=true
```

### Firebase Security Rules
```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
  }
}
```

---

## 🧪 Security Testing

### Automated Security Testing

#### Static Analysis
- **Code Scanning**: ESLint security rules
- **Dependency Scanning**: npm audit for vulnerabilities
- **Secret Detection**: Prevent credential commits
- **Type Safety**: TypeScript strict mode

#### Dynamic Testing
- **API Security Tests**: Automated endpoint security validation
- **Authentication Tests**: Login flow security verification
- **Authorization Tests**: Permission boundary validation
- **Input Validation Tests**: Malicious input handling

### Manual Security Reviews
- **Code Reviews**: Security-focused code reviews
- **Architecture Reviews**: Security design validation
- **Penetration Testing**: Regular security assessments
- **Compliance Audits**: Periodic compliance verification

---

## 📋 Security Checklist

### Deployment Security Checklist

#### Pre-Deployment
- [ ] All secrets stored in environment variables
- [ ] HTTPS enforced for production
- [ ] CORS configured for production domains
- [ ] Rate limiting configured
- [ ] Security headers implemented
- [ ] Database connections encrypted
- [ ] Audit logging enabled

#### Post-Deployment
- [ ] Security monitoring active
- [ ] SSL certificate valid
- [ ] API endpoints protected
- [ ] Authentication flow tested
- [ ] Permission system validated
- [ ] Audit logs generating
- [ ] Backup systems operational

---

## 🚨 Security Incident Response

### Incident Classification
- **P0 Critical**: Data breach, system compromise
- **P1 High**: Authentication bypass, privilege escalation
- **P2 Medium**: Information disclosure, service disruption
- **P3 Low**: Configuration issues, minor vulnerabilities

### Response Procedures
1. **Immediate Response**: Isolate affected systems
2. **Assessment**: Determine scope and impact
3. **Containment**: Prevent further damage
4. **Investigation**: Root cause analysis
5. **Recovery**: Restore secure operations
6. **Review**: Post-incident security improvements

---

## 📞 Security Contacts

### Internal Security Team
- **Security Lead**: security@alignzo.com
- **Development Team**: dev@alignzo.com
- **Infrastructure Team**: devops@alignzo.com

### External Resources
- **Firebase Security**: Firebase Console Security Settings
- **Database Security**: PostgreSQL Security Documentation
- **Cloud Security**: Cloud Provider Security Center

---

*This security guide provides comprehensive coverage of AlignzoV2's security implementation. Regular reviews and updates ensure continued security effectiveness.*
