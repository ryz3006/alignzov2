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
- **Email**: `admin email`
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
