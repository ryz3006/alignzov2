<<<<<<< HEAD
# 🚀 AlignzoV2 - Enterprise Team Productivity Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![NestJS Version](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![Next.js Version](https://img.shields.io/badge/Next.js-15.x-blue.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue.svg)](https://postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://typescriptlang.org/)

**Status**: ✅ **Production Ready** | **Version**: 2.0 | **Last Updated**: January 2025

[**🎯 Features**](#-key-features) • [**⚡ Quick Start**](#-quick-start-5-minutes) • [**📚 Documentation**](#-documentation) • [**🏗️ Architecture**](#️-architecture) • [**🤝 Contributing**](#-contributing)

</div>

---

## 🎯 Overview

**AlignzoV2** is a comprehensive enterprise team productivity platform designed to streamline work management, time tracking, and team collaboration for modern organizations. Built with cutting-edge technologies and enterprise-grade security, it provides a scalable solution for teams of all sizes.

### ✨ Key Features

- **🏢 Multi-tenant Organizations** - Complete data isolation with domain-based user assignment
- **⏱️ Advanced Time Tracking** - Real-time sessions with pause/resume, categorization, and analytics
- **👥 Team & Project Management** - Hierarchical management with flexible reporting structures
- **🔐 Enterprise Security** - Firebase authentication with role-based access control
- **📊 Real-time Analytics** - Comprehensive dashboards and productivity insights
- **🛡️ Audit Logging** - Complete activity tracking for compliance and security
- **📱 Responsive Design** - Modern, mobile-friendly interface built with Tailwind CSS

### 🏗️ Technology Stack

<table>
<tr>
<td><strong>Backend</strong></td>
<td>NestJS 10+, TypeScript 5+, PostgreSQL 16+, Prisma ORM</td>
</tr>
<tr>
<td><strong>Frontend</strong></td>
<td>Next.js 15+, React 19, Tailwind CSS, TanStack Query</td>
</tr>
<tr>
<td><strong>Authentication</strong></td>
<td>Firebase Admin SDK, JWT tokens, Google OAuth</td>
</tr>
<tr>
<td><strong>Database</strong></td>
<td>PostgreSQL with comprehensive RBAC schema</td>
</tr>
<tr>
<td><strong>DevOps</strong></td>
<td>Docker, GitHub Actions, ESLint, Prettier</td>
</tr>
</table>

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- **Node.js 20+ LTS** ([Download](https://nodejs.org/))
- **PostgreSQL 14+** ([Download](https://postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

### One-Command Setup
```bash
# Clone and setup everything
git clone <repository-url>
cd AlignzoV2
npm run install:all
npm run setup:seed
npm run dev
```

### 🎉 Access Your Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/v1/docs

### 🔑 Default Login
- **Email**: `riyas.siddikk@6dtech.co.in`
- **Method**: Google OAuth (Click "Sign in with Google")
- **Access**: Full administrator privileges

> **Need help?** Check our [📚 Complete Setup Guide](docs/setup-guide.md) for detailed instructions.

## 📚 Documentation

| Document | Description | For |
|----------|-------------|-----|
| **[Setup Guide](docs/setup-guide.md)** | Complete installation & setup instructions | New Developers |
| **[Development Guide](docs/development-guide.md)** | Development workflow & guidelines | All Developers |
| **[Architecture Guide](docs/architecture.md)** | System design & technology decisions | Architects & Leads |
| **[API Reference](docs/api-reference.md)** | Complete API documentation | Frontend & Integration Developers |
| **[Security Guide](docs/security-guide.md)** | Security implementation & best practices | Security Teams |
| **[Troubleshooting](docs/troubleshooting-guide.md)** | Common issues & solutions | Support & DevOps |
| **[Project Status](docs/project-status.md)** | Current status & roadmap | Management & Stakeholders |

## 📊 Current Status

### ✅ Production-Ready Features
- **🏢 Multi-tenant Organizations** - Complete data isolation between organizations
- **👥 User Management** - Hierarchical user structure with RBAC
- **👔 Team & Project Management** - Full lifecycle management with assignments
- **⏱️ Time Tracking System** - Advanced sessions, work logs, and analytics
- **🔐 Security Implementation** - Multi-layer authentication and authorization
- **📖 API Framework** - RESTful APIs with comprehensive OpenAPI documentation
- **🎨 Modern Frontend** - Responsive React application with Tailwind CSS

### 🚀 Performance Metrics
- **API Response Time**: < 200ms average
- **Frontend Load Time**: < 2s initial load
- **Database Performance**: Optimized with strategic indexing
- **Authentication Flow**: < 1s login process

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │    NestJS       │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 3001)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   Firebase      │    │     Redis       │    │  File Storage   │
    │   Auth          │    │   (Optional)    │    │   (Local/S3)    │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Features
- **Multi-tenant Organizations** with domain-based access control
- **Hierarchical User Management** with manager-subordinate relationships
- **Project-based Work Tracking** with customizable categories and modules
- **Real-time Time Sessions** with pause/resume and automatic logging
- **Comprehensive Audit Trail** for compliance and security
- **Extensible Permission System** supporting both RBAC and ABAC patterns

### Security Implementation
- **🔐 Firebase Authentication** with Google OAuth integration
- **🛡️ JWT Token Management** with secure refresh token rotation
- **🏢 Organization Isolation** with complete data separation
- **📝 Audit Logging** for all write operations and sensitive actions
- **⚡ Rate Limiting** on all endpoints with tiered limits
- **✅ Input Validation** using Zod schemas and class-validator

## 🛠️ Development

### Available Scripts
```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend

# Database Management
npm run setup            # Automated database setup
npm run setup:seed       # Setup database with sample data
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Building & Testing
npm run build            # Build both projects
npm run test             # Run all tests
npm run test:e2e         # Run end-to-end tests
npm run lint             # Lint all code
npm run format           # Format all code

# Utilities
npm run clean            # Clean build artifacts
npm run typecheck        # TypeScript type checking
npm run security:audit   # Security audit
```

### Development Standards
- **Code Quality**: ESLint + Prettier (enforced via Husky hooks)
- **Commit Format**: Conventional Commits
- **Testing**: Unit tests for critical paths
- **Documentation**: Update docs for API changes

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following our coding standards
4. **Run quality checks**: `npm run lint && npm run typecheck && npm run test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Workflow
- Follow the [Development Guide](docs/development-guide.md)
- Use the [API Reference](docs/api-reference.md) for endpoint details
- Check [Troubleshooting Guide](docs/troubleshooting-guide.md) for common issues

## 🌟 Features Roadmap

### Phase 3: Advanced Features
- **📊 Enhanced Analytics** - Advanced reporting and insights
- **📱 Mobile Application** - React Native cross-platform app
- **📧 Email Notifications** - Automated notification system
- **🔍 Advanced Search** - Global search across entities
- **📤 Bulk Operations** - CSV import/export functionality

### Phase 4: Enterprise Features
- **🔐 SSO Integration** - SAML, LDAP authentication
- **🔗 Third-party Integrations** - Tool connections (Jira, Slack, etc.)
- **⚙️ Workflow Automation** - Business process automation
- **🤖 AI/ML Features** - Predictive analytics and insights
- **📋 Advanced Compliance** - Enhanced audit and compliance tools

## 📞 Support

### Getting Help
- **📚 Documentation**: [Complete guides](docs/README.md)
- **🐛 Issues**: [Report bugs](https://github.com/your-repo/alignzo/issues)
- **💬 Discussions**: [Community discussions](https://github.com/your-repo/alignzo/discussions)
- **📧 Contact**: [Support team](mailto:support@alignzo.com)

### Resources
- **🎯 Quick Start**: [5-minute setup guide](#-quick-start-5-minutes)
- **🏗️ Architecture**: [System design details](docs/architecture.md)
- **🔒 Security**: [Security implementation guide](docs/security-guide.md)
- **🚨 Troubleshooting**: [Common issues & solutions](docs/troubleshooting-guide.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/) and [Next.js](https://nextjs.org/)
- Database powered by [PostgreSQL](https://postgresql.org/) and [Prisma](https://prisma.io/)
- Authentication via [Firebase](https://firebase.google.com/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">

**Ready to boost your team's productivity?** [Get started now!](#-quick-start-5-minutes) 🚀

Made with ❤️ for modern teams

</div>
=======
# Alignzo - Enterprise Team Productivity Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0+-red.svg)](https://redis.io/)

**Status**: ✅ **Phase 1 Complete - Core Infrastructure Operational**  
**Last Updated**: August 6, 2025

## 🆕 Recent Fixes (August 6, 2025)

### ✅ Issues Resolved
- **Project Management**: Complete overhaul of project creation, editing, and list functionality
  - Fixed authentication and organization assignment issues
  - Resolved date format problems (ISO-8601 conversion)
  - Converted from card layout to proper table structure
  - Fixed component import and type issues
  - [📋 Detailed Documentation](./docs/project-management-fixes-summary.md)
- **PrismaClientValidationError**: Fixed missing `reportingTo` field in ProjectMember model
- **ReferenceError: Modal is not defined**: Added missing Modal import in frontend
- **TypeScript Errors**: Fixed null pointer issues in auth.service.ts
- **User Creation Validation**: Fixed managerId validation to handle empty values
- **Super Admin User**: Ensured proper database seeding and visibility

### 🔧 Key Improvements
- Enhanced DTO validation with proper nested object handling
- Improved error handling for optional fields
- Fixed authentication flow and user visibility
- Updated Prisma schema with missing relations
- **Project Management**: Full CRUD operations with proper UI/UX

## 🎯 Project Overview

Alignzo is a comprehensive enterprise team productivity platform designed to streamline work management, time tracking, and team collaboration. Built with modern technologies and a focus on scalability, security, and user experience.

### 🚀 Key Features

- **🔐 Secure Authentication**: Firebase + JWT with role-based access control
- **👥 User Management**: Complete CRUD operations with hierarchical organization
- **⚡ Real-time Updates**: WebSocket-powered live collaboration
- **📊 Analytics & Reporting**: Comprehensive insights and dashboards
- **🔗 External Integrations**: JIRA, Remedy, monitoring systems
- **🤖 AI-Powered**: RAG infrastructure for intelligent assistance
- **📱 Mobile Ready**: Cross-platform mobile application

### 🏗️ Architecture

- **Backend**: NestJS with TypeScript, PostgreSQL, Redis
- **Frontend**: Next.js 15 with App Router, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Firebase + JWT tokens
- **Real-time**: Socket.io for live updates
- **AI/ML**: Vector database with RAG capabilities

## 📊 Current Status

### ✅ Phase 1 Complete (August 4, 2025)
- **Backend Infrastructure**: NestJS application with authentication, user management, and security
- **Frontend Infrastructure**: Next.js application with modern React setup
- **Database**: PostgreSQL with complete schema (40+ entities)
- **Authentication**: Firebase integration with JWT tokens
- **Security**: Role-based access control, rate limiting, input validation
- **API Documentation**: Swagger/OpenAPI integration
- **Health Monitoring**: System, database, and application health endpoints

### 🚧 Phase 2 Ready to Start
- Project and team management
- Time tracking system with floating widget
- Work log management with approval workflows
- Basic analytics and reporting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7.0+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AlignzoV2
   ```

2. **Set up environment**
   ```bash
   cp configs/development.env .env
   ```

3. **Install dependencies**
   ```bash
   npm run install:all
   ```

4. **Set up database**
   ```bash
   npm run setup
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Database UI**: Run `npm run db:studio`

## 📚 Documentation

### Essential Guides
- **[🚀 Development Guide](./docs/development-guide.md)** - Complete setup and development workflow
- **[🛠️ Troubleshooting Guide](./docs/troubleshooting-guide.md)** - Common issues and solutions
- **[🔗 API URL Standardization](./docs/api-url-standardization.md)** - API configuration and usage guidelines
- **[🔗 API Quick Reference](./docs/api-quick-reference.md)** - Quick reference for API calls
- **[⚙️ Environment Setup](./docs/environment-setup.md)** - Environment configuration guide

### Additional Resources
- **[🏗️ Architecture](./docs/architecture.md)** - System architecture and design
- **[🔐 Authentication](./docs/authentication.md)** - Authentication system details
- **[🗄️ Database](./docs/database.md)** - Database schema and management
- **[🧪 Testing](./docs/testing.md)** - Testing strategies and guidelines

## 📁 Project Structure
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management module
│   │   ├── prisma/         # Database service
│   │   └── main.ts         # Application entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and configurations
│   └── package.json
├── configs/               # Configuration files
│   ├── development.env    # Development environment
│   ├── firebase/          # Firebase configuration
│   └── database.ts        # Database configuration
├── docs/                  # Documentation
│   ├── development-progress.md
│   ├── current-status.md
│   ├── development-roadmap.md
│   └── configuration-summary.md
├── scripts/               # Utility scripts
└── package.json          # Root package.json
```

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database
```

### Code Quality
```bash
npm run lint             # Lint all code
npm run format           # Format code
npm run typecheck        # TypeScript checking
npm run test             # Run tests
```

### Build & Deploy
```bash
npm run build            # Build all applications
npm run start            # Start production
```

## 📚 API Documentation

### Available Endpoints

#### Health & System
- `GET /api/health` - Application health
- `GET /api/health/db` - Database health
- `GET /api/health/system` - System status

#### Authentication
- `POST /api/auth/login/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### User Management
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/search` - Search users

### Interactive Documentation
Visit http://localhost:3001/api/docs for interactive API documentation with Swagger UI.

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### 1. User Creation Issues
**Problem**: "ManagerId must be UUID" error when creating users
**Solution**: 
- Leave the Manager field empty when creating the first user
- The validation now accepts empty/undefined manager values
- Assign managers after creating multiple users

#### 2. Super Admin User Not Visible
**Problem**: Super admin user not appearing in users list
**Solution**:
- Ensure you're logged in with the admin user
- The user exists in database and should be visible after authentication
- Check browser console for any API errors

#### 3. Authentication Issues
**Problem**: 401 Unauthorized errors
**Solution**:
- Log in via Google OAuth at http://localhost:3000
- Use the super admin email: `admin email`
- Clear browser cache if authentication persists

#### 4. Database Connection Issues
**Problem**: Database connection errors
**Solution**:
- Ensure PostgreSQL is running on port 5432
- Check database credentials in `configs/development.env`
- Run `npm run db:seed` to populate initial data

#### 5. Port Conflicts
**Problem**: "address already in use" errors
**Solution**:
- Kill existing Node.js processes: `taskkill /f /im node.exe`
- Restart development servers: `npm run dev`

### Getting Started Checklist
1. ✅ Database seeded with roles and super admin user
2. ✅ Backend running on port 3001
3. ✅ Frontend running on port 3000
4. ✅ Log in with Google OAuth
5. ✅ Access Users page to verify super admin visibility
6. ✅ Create new users (leave manager field empty initially)

## 🔐 Security Features

- **Authentication**: Firebase + JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schemas with class-validator
- **Rate Limiting**: Express rate limiting (1000 req/15min)
- **Security Headers**: Helmet middleware
- **CORS**: Configured for secure cross-origin requests
- **Audit Logging**: Comprehensive activity tracking

## 🗄️ Database Schema

The application uses PostgreSQL with a comprehensive schema including:

- **Users & Authentication**: User profiles, roles, permissions
- **Organizations**: Multi-tenant organization support
- **Projects & Teams**: Project management and team collaboration
- **Time Tracking**: Time sessions and work logs
- **Analytics**: Performance metrics and reporting
- **Integrations**: External system connections
- **AI/ML**: Vector embeddings and knowledge base

### Database Features
- **UUID Primary Keys**: Using `uuid-ossp` extension
- **Vector Support**: `pgvector` extension for AI capabilities
- **Full-Text Search**: PostgreSQL native search capabilities
- **Audit Trail**: Comprehensive change tracking
- **Performance Optimization**: Strategic indexing and query optimization

## 🚧 Development Roadmap

### Phase 1: Foundation ✅ **COMPLETED**
- [x] Core infrastructure and authentication
- [x] User management and RBAC
- [x] Security middleware and API documentation
- [x] Health monitoring and system status

### Phase 2: Core Features 🚧 **READY TO START**
- [ ] Project and team management
- [ ] Time tracking with floating widget
- [ ] Work log management with approvals
- [ ] Basic analytics and reporting

### Phase 3: Integrations 📋 **PLANNED**
- [ ] Data import/export system
- [ ] JIRA and Remedy integrations
- [ ] Monitoring system connections
- [ ] Integration management framework

### Phase 4: Analytics 📋 **PLANNED**
- [ ] Advanced analytics dashboards
- [ ] Custom reporting engine
- [ ] Performance optimization
- [ ] Business intelligence features

### Phase 5: AI Foundation 📋 **PLANNED**
- [ ] RAG infrastructure with vector database
- [ ] Knowledge base management
- [ ] AI-powered chat interface
- [ ] Intelligent document processing

### Phase 6: Social Features 📋 **PLANNED**
- [ ] Recognition and achievement system
- [ ] Leave management
- [ ] Shift scheduling
- [ ] Mobile application

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Core business logic and utilities
- **Integration Tests**: API endpoints and database operations
- **Component Tests**: React component functionality
- **E2E Tests**: Complete user workflows

### Running Tests
```bash
npm run test             # All tests
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only
npm run test:e2e         # End-to-end tests
```

## 📊 Performance Metrics

### Achieved Metrics (Phase 1)
- **API Response Time**: <200ms for health endpoints
- **Database Connection**: <50ms connection time
- **Startup Time**: <5 seconds for backend
- **Hot Reload**: <2 seconds for code changes
- **Authentication**: JWT token validation working
- **Authorization**: Role-based access control implemented

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Follow the established code style
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues
1. **Port Conflicts**: Kill processes on ports 3000/3001
2. **Database Issues**: Run `npm run db:generate`
3. **Firebase Issues**: Check service account configuration (optional)
4. **Dependency Issues**: Run `npm run install:all`

### Getting Help
- **API Documentation**: http://localhost:3001/api/docs
- **Database UI**: Run `npm run db:studio`
- **Health Checks**: http://localhost:3001/api/health
- **Documentation**: Check `docs/` directory
- **Progress Log**: [Development Progress](./docs/development-progress.md)

## 🏆 Project Status

**Current Phase**: Phase 1 Complete ✅  
**Next Phase**: Phase 2 - Core Work Management Features 🚧  
**Overall Progress**: 6% Complete (3 hours of 50 weeks)  
**Estimated Completion**: ~49 weeks remaining

The core infrastructure is complete and operational. All backend services are running, the database is connected, and the API is fully functional. The next step is to implement the frontend UI components to complete Phase 1, then move on to Phase 2 work management features.

---

**Built with ❤️ for enterprise productivity**
>>>>>>> 5786935d5ff4298e00c25f1cae9c9f7431733efb
