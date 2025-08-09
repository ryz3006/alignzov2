# 📚 AlignzoV2 Documentation

**Version**: 2.0  
**Last Updated**: January 2025  
**Status**: Production Ready

---

## 🎯 Quick Navigation

| Document | Description | For |
|----------|-------------|-----|
| **[Setup Guide](setup-guide.md)** | Complete installation & setup instructions | New Developers |
| **[Architecture](architecture.md)** | System design & technology decisions | Architects & Leads |
| **[API Reference](api-reference.md)** | Complete API documentation | Frontend & Integration Developers |
| **[Development Guide](development-guide.md)** | Development workflow & guidelines | All Developers |
| **[Security Guide](security-guide.md)** | Security implementation & best practices | Security Teams |
| **[Troubleshooting](troubleshooting-guide.md)** | Common issues & solutions | Support & DevOps |

---

## 🚀 Project Overview

AlignzoV2 is a comprehensive enterprise team productivity platform designed for:

- **Time Tracking & Work Management**: Advanced time tracking with project categorization
- **Multi-tenant Organizations**: Complete data isolation between organizations  
- **Role-Based Access Control**: Granular permissions and access levels
- **Team Collaboration**: Team management with hierarchical reporting
- **Analytics & Reporting**: Real-time dashboards and productivity insights
- **Firebase Authentication**: Secure Google OAuth integration
- **Audit Logging**: Complete activity tracking and compliance

---

## 🏗️ Architecture Summary

### Technology Stack
- **Backend**: NestJS 10+ with TypeScript, PostgreSQL 16+, Prisma ORM
- **Frontend**: Next.js 15+ with React 19, Tailwind CSS, TanStack Query
- **Authentication**: Firebase Admin SDK with JWT tokens
- **Database**: PostgreSQL with comprehensive RBAC schema
- **Optional**: Redis (caching/queues), Elasticsearch (SIEM)

### System Design
```
Frontend (Next.js) ↔ Backend API (NestJS) ↔ PostgreSQL Database
        ↕                     ↕                     ↕
Firebase Auth        Redis Cache        Audit Logging
```

---

## 📊 Current Status

### ✅ Completed Features
- **Multi-tenant Organization System** - Complete data isolation
- **User Management & Authentication** - Google OAuth + RBAC
- **Team & Project Management** - Full CRUD with assignments  
- **Time Tracking System** - Sessions, work logs, analytics
- **Permission System** - Granular role-based access control
- **API Framework** - RESTful with OpenAPI documentation
- **Security Implementation** - JWT, rate limiting, audit logging

### 🔄 In Development
- **Enhanced Analytics** - Advanced reporting and insights
- **Mobile Optimization** - API improvements for mobile clients
- **Performance Tuning** - Caching and query optimization

### 📋 Roadmap
- **Mobile Application** - React Native implementation
- **Advanced Integrations** - Third-party tool connections
- **AI/ML Features** - Predictive analytics and insights

---

## 🏁 Getting Started

### Quick Setup (5 Minutes)
```bash
# Clone and install
git clone <repository-url>
cd AlignzoV2
npm run install:all

# Setup database and seed data
npm run setup:seed

# Start development servers
npm run dev
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001  
- API Docs: http://localhost:3001/api/v1/docs

**Default Login:** `riyas.siddikk@6dtech.co.in` (Google OAuth)

### Prerequisites
- Node.js 20+ LTS
- PostgreSQL 14+
- Git

### Detailed Setup
See **[Setup Guide](setup-guide.md)** for comprehensive installation instructions.

---

## 🔧 Development Workflow

### Core Commands
```bash
# Development
npm run dev              # Start both services
npm run dev:backend      # Backend only  
npm run dev:frontend     # Frontend only

# Database
npm run db:studio        # Visual database browser
npm run db:seed          # Refresh sample data
npm run db:generate      # Update Prisma client

# Quality
npm run lint             # Code linting
npm run test             # Run tests
npm run build            # Production build
```

### API Development
- **Base URL**: `/api/v1/*`
- **Authentication**: Firebase JWT → Custom JWT
- **Documentation**: Auto-generated OpenAPI/Swagger
- **Standards**: RESTful design with consistent error handling

---

## 🔒 Security Features

- **Multi-factor Authentication** via Firebase + Google OAuth
- **Role-Based Access Control** with organization-scoped permissions
- **Data Isolation** between organizations with domain validation
- **Audit Logging** for all write operations and sensitive actions
- **Rate Limiting** on all endpoints with tiered limits
- **Input Validation** using Zod schemas and class-validator
- **CORS Protection** with environment-specific origins

---

## 📞 Support & Troubleshooting

### Common Issues
1. **Database Connection** - Check PostgreSQL service and credentials
2. **Authentication Errors** - Verify Firebase configuration  
3. **Port Conflicts** - Kill processes: `npx kill-port 3000 3001`
4. **API Failures** - Check backend health: `curl localhost:3001/healthz`

### Getting Help
- **Troubleshooting Guide**: [troubleshooting-guide.md](troubleshooting-guide.md)
- **API Documentation**: [api-reference.md](api-reference.md)  
- **Development Guide**: [development-guide.md](development-guide.md)
- **Architecture Deep Dive**: [architecture.md](architecture.md)

---

## 📈 Performance & Scalability

### Current Metrics
- **API Response Time**: < 200ms (95th percentile)
- **Database Performance**: Optimized queries with proper indexing
- **Frontend Load Time**: < 2s initial load
- **Authentication Flow**: < 1s login process

### Scalability Design
- **Database**: PostgreSQL with connection pooling
- **Caching**: Multi-layer strategy (Redis, HTTP, Browser)
- **API**: RESTful design with cursor-based pagination
- **Frontend**: Optimized bundles with code splitting

---

## 🤝 Contributing

### Development Standards
- **Code Quality**: ESLint + Prettier (enforced via Husky)
- **Commit Format**: Conventional Commits
- **Testing**: Unit tests for critical paths
- **Documentation**: Update docs for API changes

### Workflow
1. Create feature branch
2. Follow development guidelines
3. Add tests for new functionality  
4. Update documentation
5. Submit pull request

---

## 📄 License

This project is licensed under the MIT License.

---

*This documentation provides a comprehensive guide to the AlignzoV2 platform. For specific topics, refer to the individual guides linked above.*