# 🚀 AlignzoV2 Setup Guide

Complete installation and setup instructions for AlignzoV2.

**Estimated Time**: 10-15 minutes  
**Difficulty**: Beginner  
**Last Updated**: January 2025

---

## 📋 Prerequisites

### Required Software

| Software | Version | Download | Verification |
|----------|---------|----------|--------------|
| **Node.js** | 20+ LTS | [nodejs.org](https://nodejs.org/) | `node --version` |
| **PostgreSQL** | 14+ | [postgresql.org](https://postgresql.org/download/) | `psql --version` |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) | `git --version` |

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space  
- **OS**: Windows 10+, macOS 10.14+, Linux Ubuntu 18.04+

### Verify Prerequisites
```bash
node --version    # Should show v20.x.x
psql --version    # Should show PostgreSQL 14.x+
git --version     # Should show git version
npm --version     # Should show 9.x.x+
```

---

## 🚀 Quick Setup (Automated)

### One-Command Installation
```bash
# Clone repository
git clone <repository-url>
cd AlignzoV2

# Install dependencies and setup database
npm run install:all
npm run setup:seed

# Start development servers
npm run dev
```

### Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/v1/docs

### Default Login
- **Email**: `riyas.siddikk@6dtech.co.in`
- **Method**: Click "Sign in with Google"
- **Access**: Full administrator privileges

---

## 🛠️ Manual Setup (Step by Step)

### 1. Clone Repository
```bash
git clone <repository-url>
cd AlignzoV2

# Verify project structure
ls -la
# Should show: backend/, frontend/, configs/, docs/, scripts/
```

### 2. Install Dependencies
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Or install manually
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Database Setup

#### Option A: Automated Database Setup
```bash
npm run setup:seed
```

#### Option B: Manual Database Setup
```bash
# Create PostgreSQL database
createdb alignzo_v2

# Or using psql
psql -U postgres -c "CREATE DATABASE alignzo_v2;"
psql -U postgres -c "CREATE USER alignzo WITH PASSWORD 'alignzo';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE alignzo_v2 TO alignzo;"

# Setup schema and seed data
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Environment Configuration

#### Backend Environment
```bash
# Copy pre-configured development environment
cp configs/development.env backend/.env

# Verify configuration
cat backend/.env | head -10
```

#### Frontend Environment  
```bash
# Copy environment for frontend
cp configs/development.env frontend/.env.local

# Or create minimal configuration
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > frontend/.env.local
```

### 5. Start Services

#### Start Both Services
```bash
npm run dev
```

#### Start Services Separately
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

---

## 🔥 Firebase Configuration

### ✅ Pre-configured Setup

Firebase is **already configured** and ready to use:

- **Service Account**: `configs/firebase/dalignzo-firebase-adminsdk-fbsvc-326bf38898.json`
- **Project ID**: `dalignzo`
- **Environment Variables**: Pre-configured in development.env
- **OAuth Provider**: Google authentication enabled

### Verify Firebase Setup
```bash
# Check service account file exists
ls -la configs/firebase/dalignzo-firebase-adminsdk-fbsvc-326bf38898.json

# Verify Firebase environment variables
grep FIREBASE backend/.env
```

**No additional Firebase setup required for development.**

---

## ✅ Verification & Testing

### 1. Health Checks
```bash
# Check backend health
curl http://localhost:3001/healthz

# Check database connection
curl http://localhost:3001/readyz

# Check frontend
curl http://localhost:3000
```

### 2. Authentication Test
1. Navigate to http://localhost:3000
2. Click "Sign in with Google"
3. Use email: `riyas.siddikk@6dtech.co.in`
4. Verify dashboard access

### 3. API Testing
```bash
# Test API documentation
open http://localhost:3001/api/v1/docs

# Test authenticated endpoint (replace TOKEN with actual JWT)
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/v1/users
```

### 4. Database Verification
```bash
# Open Prisma Studio (visual database browser)
npm run db:studio

# Check database tables directly
psql "postgresql://alignzo:alignzo@localhost:5432/alignzo_v2" -c "\dt"
```

---

## 🔧 Optional Services

### Redis (Recommended for Performance)
```bash
# Install Redis
# Windows: Download from redis.io
# macOS: brew install redis && brew services start redis  
# Linux: sudo apt install redis-server && sudo systemctl start redis

# Verify Redis
redis-cli ping
# Should return "PONG"
```

**Benefits**: Response caching, background job processing, session optimization

### Elasticsearch (Optional for SIEM)
```bash
# Install Elasticsearch (advanced users only)
# Windows: Download from elastic.co
# macOS: brew install elasticsearch
# Linux: Follow Elastic installation guide

# Verify Elasticsearch
curl http://localhost:9200
```

---

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL service
# Windows: services.msc → PostgreSQL
# macOS: brew services list | grep postgres
# Linux: sudo systemctl status postgresql

# Test connection manually
psql "postgresql://alignzo:alignzo@localhost:5432/alignzo_v2" -c "SELECT 1"

# If connection fails, recreate user
psql -U postgres
CREATE USER alignzo WITH PASSWORD 'alignzo';
GRANT ALL PRIVILEGES ON DATABASE alignzo_v2 TO alignzo;
\q
```

### Port Conflicts
```bash
# Kill processes using ports
npx kill-port 3000 3001

# Find what's using ports
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -i :3000

# Use different ports
PORT=3002 npm run dev:frontend
PORT=3003 npm run dev:backend
```

### Node.js Version Issues
```bash
# Check current version
node --version

# Install Node Version Manager
# Windows: Use nvm-windows
# macOS/Linux: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 20
nvm install 20
nvm use 20
nvm alias default 20
```

### Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all

# If npm fails, try yarn
npm install -g yarn
yarn install
```

### Database Schema Issues
```bash
cd backend

# Reset database completely
npm run db:migrate:reset

# Or force push schema
npm run db:push --accept-data-loss
npm run db:seed
```

---

## 🎯 Development Workflow

### Available Commands
```bash
# Development
npm run dev              # Start both services
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Database Management  
npm run db:studio        # Visual database browser
npm run db:generate      # Update Prisma client
npm run db:push          # Push schema changes
npm run db:seed          # Refresh sample data

# Code Quality
npm run lint             # Lint all code
npm run format           # Format all code  
npm run typecheck        # TypeScript checking
npm run test             # Run all tests

# Building
npm run build            # Build for production
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only
```

### Environment Variables
The application uses hierarchical configuration:

1. **Development**: `configs/development.env` (pre-configured)
2. **Production**: Environment variables or `.env` files
3. **Testing**: Separate test database configuration

---

## 🎉 Success!

Your AlignzoV2 application is now running successfully!

### Quick Access
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:3001
- 📚 **API Docs**: http://localhost:3001/api/v1/docs
- 🗄️ **Database**: `npm run db:studio`

### Next Steps
1. **Explore the Application**: Navigate through different modules
2. **Review Documentation**: Check out [development-guide.md](development-guide.md)
3. **API Testing**: Use the interactive API documentation
4. **Development**: Start building your features!

### Default Login
- **Admin Email**: `riyas.siddikk@6dtech.co.in`
- **Authentication**: Google OAuth
- **Access Level**: Full system administrator

---

## 📞 Getting Help

If you encounter issues:

1. **Troubleshooting Guide**: [troubleshooting-guide.md](troubleshooting-guide.md)
2. **Development Guide**: [development-guide.md](development-guide.md)
3. **API Documentation**: [api-reference.md](api-reference.md)
4. **Architecture Guide**: [architecture.md](architecture.md)

---

*Happy coding! 🚀*
