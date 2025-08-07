# 🚀 Quick Start Guide

## ⚡ Get Running in 5 Minutes

### Prerequisites
- Node.js 20+ LTS
- PostgreSQL 16+
- Git

### 1. Clone & Setup
```bash
git clone <repository-url>
cd AlignzoV2
npm install
```

### 2. Database Setup
```bash
# Start PostgreSQL (if not running)
# On Windows: Start PostgreSQL service
# On Mac: brew services start postgresql
# On Linux: sudo systemctl start postgresql

# Setup database
npm run db:generate
npm run db:seed
```

### 3. Environment Configuration
```bash
# Copy environment files
cp configs/development.env backend/.env
cp configs/development.env frontend/.env

# Configure Firebase (see Firebase setup guide)
```

### 4. Start Development Servers
```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **Database UI**: Run `npm run db:studio`

### 6. Login with Super Admin
- **Email**: `riyas.siddikk@6dtech.co.in`
- **Method**: Click "Sign in with Google"
- **Access**: Full system access with all permissions

---

## 🔧 Common Setup Issues

### Port Conflicts
If ports 3000/3001 are busy:
```bash
# Kill processes on ports
npx kill-port 3000 3001

# Or use different ports
# Frontend: PORT=3002 npm run dev
# Backend: PORT=3003 npm run start:dev
```

### Database Connection Issues
```bash
# Check PostgreSQL status
# Windows: services.msc → PostgreSQL
# Mac/Linux: sudo systemctl status postgresql

# Reset database
npm run db:reset
npm run db:seed
```

### Firebase Configuration
1. Create Firebase project
2. Enable Google Authentication
3. Download service account JSON
4. Place in `configs/firebase/`
5. Update environment variables

### React Hooks Issues
If you encounter React Hooks errors:
- Check component hook order (all hooks must be called before conditional returns)
- Ensure consistent hook calls across renders
- See troubleshooting guide for detailed solutions

---

## 📋 Development Workflow

### Making Changes
1. **Frontend**: Edit files in `frontend/src/`
2. **Backend**: Edit files in `backend/src/`
3. **Database**: Edit `database/schema.prisma`
4. **Hot reload**: Changes auto-refresh in browser

### Testing Features
1. **Authentication**: Test with different user roles
2. **Permissions**: Verify role-based access control
3. **API**: Use Swagger UI for endpoint testing
4. **Database**: Use Prisma Studio for data inspection

### Debugging
- **Frontend**: Browser DevTools console
- **Backend**: Terminal logs
- **Database**: Prisma Studio
- **Network**: Browser Network tab

---

## 🎯 Next Steps

### Phase 1 Complete ✅
- ✅ Authentication system
- ✅ User management
- ✅ RBAC system
- ✅ Basic UI components

### Phase 2 Ready 🚧
- Project management
- Time tracking
- Work logs
- Analytics

### Learning Resources
- [Architecture Guide](./architecture.md)
- [Development Guide](./development-guide.md)
- [RBAC Troubleshooting](./rbac-troubleshooting.md)
- [API Reference](./api-reference.md)

---

*Need help? Check the troubleshooting guide or create an issue.* 