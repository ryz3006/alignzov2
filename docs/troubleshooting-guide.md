# 🛠️ Troubleshooting Guide

**Last Updated**: August 6, 2025

This guide covers common issues and their solutions for the Alignzo platform.

---

## 🚨 Critical Issues & Solutions

### 1. User Creation Validation Errors

#### Problem
```
"ManagerId must be UUID" error when creating users
```

#### Root Cause
- DTO validation was rejecting empty strings for managerId
- Circular dependency: need users to create users with managers

#### Solution
1. **Leave Manager field empty** when creating the first user
2. The validation now accepts empty/undefined values
3. Assign managers after creating multiple users
4. Updated DTO with proper Transform decorator

#### Technical Fix Applied
```typescript
// In CreateUserDto
@IsOptional()
@Transform(({ value }) => value === '' ? undefined : value)
@IsUUID(undefined, { message: 'Manager ID must be a valid UUID' })
managerId?: string;
```

---

### 2. Super Admin User Not Visible

#### Problem
- Super admin user `riyas.siddikk@6dtech.co.in` not appearing in users list
- Can't select managers from dropdown

#### Root Cause
- Authentication required to access users API
- User needs to log in first to see the users list

#### Solution
1. **Log in via Google OAuth** at http://localhost:3000
2. Use email: `riyas.siddikk@6dtech.co.in`
3. Complete authentication flow
4. Navigate to Users page - super admin should be visible

#### Verification Steps
```bash
# Check if super admin exists in database
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { email: 'riyas.siddikk@6dtech.co.in' } })
  .then(user => console.log('Super admin:', user))
  .finally(() => prisma.$disconnect());
"
```

---

### 3. PrismaClientValidationError

#### Problem
```
PrismaClientValidationError: Unknown field 'reportingTo' for include statement on model 'ProjectMember'
```

#### Root Cause
- Missing `reportingTo` field in Prisma schema
- Discrepancy between `backend/prisma/schema.prisma` and `database/schema.prisma`

#### Solution
1. Added `reportingToId` field to ProjectMember model
2. Added `reportingTo` relation to ProjectMember
3. Added `projectReporting` relation to User model
4. Regenerated Prisma client

#### Technical Fix Applied
```prisma
model ProjectMember {
  // ... existing fields
  reportingToId   String?       @db.Uuid
  reportingTo     User?         @relation("ProjectReporting", fields: [reportingToId], references: [id])
}

model User {
  // ... existing fields
  projectReporting  ProjectMember[] @relation("ProjectReporting")
}
```

---

### 4. TypeScript Compilation Errors

#### Problem
```
error TS18047: 'user' is possibly 'null'
```

#### Root Cause
- Missing null checks in auth.service.ts
- TypeScript strict mode enabled

#### Solution
1. Added proper null checks before using user object
2. Added error handling for null cases
3. Ensured all code paths handle null values

#### Technical Fix Applied
```typescript
// Before
const primaryRole = user.userRoles?.[0]?.role?.name || 'USER';

// After
if (!user) {
  throw new UnauthorizedException('Failed to create or retrieve user');
}
const primaryRole = user.userRoles?.[0]?.role?.name || 'USER';
```

---

### 5. Frontend ReferenceError

#### Problem
```
ReferenceError: Modal is not defined
```

#### Root Cause
- Missing Modal import in frontend components

#### Solution
1. Added Modal to import statement
2. Updated component imports

#### Technical Fix Applied
```typescript
// Before
import { Button, Input, Card, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';

// After
import { Button, Input, Card, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '@/components/ui';
```

---

## 🔧 General Troubleshooting

### Authentication Issues

#### Problem: 401 Unauthorized
**Solution:**
1. Clear browser cache and cookies
2. Log in via Google OAuth
3. Check JWT token in browser storage
4. Verify Firebase configuration

#### Problem: Google OAuth not working
**Solution:**
1. Check Firebase configuration in frontend
2. Verify OAuth credentials in Google Cloud Console
3. Ensure redirect URIs are configured correctly

### Database Issues

#### Problem: Database connection failed
**Solution:**
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Verify database credentials
psql -h localhost -U alignzo -d alignzo_v2

# Check environment variables
echo $DATABASE_URL
```

#### Problem: Database not seeded
**Solution:**
```bash
cd backend
npm run db:seed
```

### Port Conflicts

#### Problem: "address already in use"
**Solution:**
```bash
# Kill all Node.js processes
taskkill /f /im node.exe

# Restart development servers
npm run dev
```

### API Issues

#### Problem: CORS errors
**Solution:**
1. Check CORS configuration in backend
2. Verify API URL in frontend
3. Ensure both servers are running

#### Problem: API endpoints not responding
**Solution:**
```bash
# Test backend health
curl http://localhost:3001/api/health

# Check if backend is running
netstat -an | findstr ":3001"
```

---

## 📋 Getting Started Checklist

### Initial Setup
- [ ] PostgreSQL running on port 5432
- [ ] Redis running on port 6379
- [ ] Environment variables configured
- [ ] Dependencies installed: `npm run install:all`

### Database Setup
- [ ] Database created: `createdb alignzo_v2`
- [ ] Schema applied: `npm run db:push`
- [ ] Data seeded: `npm run db:seed`
- [ ] Prisma client generated: `npm run db:generate`

### Application Startup
- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] No compilation errors
- [ ] Health endpoints responding

### Authentication
- [ ] Logged in with `riyas.siddikk@6dtech.co.in`
- [ ] JWT token received
- [ ] Can access protected routes
- [ ] Super admin user visible in Users page

### User Management
- [ ] Can view users list
- [ ] Can create new users (leave manager empty initially)
- [ ] Can assign managers after creating multiple users
- [ ] No validation errors

---

## 🆘 Emergency Procedures

### If Everything is Broken
1. **Stop all services**
   ```bash
   taskkill /f /im node.exe
   ```

2. **Reset database**
   ```bash
   cd backend
   npm run db:migrate:reset
   npm run db:seed
   ```

3. **Restart everything**
   ```bash
   npm run dev
   ```

4. **Verify setup**
   - Check health endpoints
   - Log in with super admin
   - Test user creation

### If Authentication is Broken
1. Clear browser data
2. Check Firebase configuration
3. Verify environment variables
4. Restart development servers

### If Database is Corrupted
1. Drop and recreate database
2. Run migrations
3. Seed with fresh data
4. Verify super admin user exists

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the [Development Guide](./development-guide.md)
2. Review [API Documentation](./api-reference.md)
3. Check browser console for errors
4. Review backend logs for detailed error messages
5. Verify all environment variables are set correctly

---

*This troubleshooting guide is updated regularly as new issues are discovered and resolved.* 