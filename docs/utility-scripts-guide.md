# Utility Scripts Guide

This document provides a reference for the utility scripts created during the project management fixes and improvements.

## 🛠️ Available Scripts

### Database Management Scripts

#### 1. Check Organizations
**File**: `backend/scripts/check-organizations.ts`
**Purpose**: View all organizations and their associated users
**Usage**:
```bash
cd backend
npx ts-node scripts/check-organizations.ts
```
**Output**: Lists all active organizations with user counts and details

#### 2. Create Organization
**File**: `backend/scripts/create-organization.ts`
**Purpose**: Create a new organization for a specific domain
**Usage**:
```bash
cd backend
npx ts-node scripts/create-organization.ts
```
**Note**: Currently configured for `6dtech.co` domain

#### 3. Assign User to Organization
**File**: `backend/scripts/assign-user-to-org.ts`
**Purpose**: Assign a user to a specific organization
**Usage**:
```bash
cd backend
npx ts-node scripts/assign-user-to-org.ts
```
**Note**: Currently configured for `riyas.siddikk@6dtech.co.in` user

#### 4. Activate User
**File**: `backend/scripts/activate-user.ts`
**Purpose**: Activate a user account and assign SUPER_ADMIN role
**Usage**:
```bash
cd backend
npx ts-node scripts/activate-user.ts
```
**Features**:
- Activates user account (`isActive: true`)
- Creates organization if it doesn't exist
- Assigns SUPER_ADMIN role if missing
- Handles user creation if user doesn't exist

#### 5. Cleanup Duplicate Organizations
**File**: `backend/scripts/cleanup-duplicate-org.ts`
**Purpose**: Remove duplicate organizations and reassign users
**Usage**:
```bash
cd backend
npx ts-node scripts/cleanup-duplicate-org.ts
```
**Features**:
- Identifies duplicate organizations
- Moves users to correct organization
- Deletes duplicate organizations
- Ensures proper user-organization assignment

## 🔧 Frontend Utilities

### Clear Authentication Tokens
**File**: `frontend/src/app/login/clear-token.ts`
**Purpose**: Clear browser authentication tokens
**Usage**:
```javascript
// Run in browser console
clearAuthTokens()
```
**Features**:
- Clears localStorage tokens
- Clears sessionStorage
- Forces page reload
- Available globally in browser console

## 📋 Common Use Cases

### 1. Fix Authentication Issues
```bash
# 1. Check current organization setup
npx ts-node scripts/check-organizations.ts

# 2. Clean up any duplicates
npx ts-node scripts/cleanup-duplicate-org.ts

# 3. Ensure user is properly assigned
npx ts-node scripts/assign-user-to-org.ts

# 4. Clear browser tokens (in browser console)
clearAuthTokens()
```

### 2. Set Up New Organization
```bash
# 1. Create organization
npx ts-node scripts/create-organization.ts

# 2. Activate user with proper role
npx ts-node scripts/activate-user.ts
```

### 3. Debug User Issues
```bash
# 1. Check user status
npx ts-node scripts/activate-user.ts

# 2. Check organization assignment
npx ts-node scripts/assign-user-to-org.ts
```

## 🚨 Troubleshooting

### Common Issues

#### Script Fails to Run
**Cause**: Missing dependencies or TypeScript errors
**Solution**:
```bash
# Install dependencies
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

#### Database Connection Issues
**Cause**: Environment variables not set or database not running
**Solution**:
```bash
# Check environment file
cat .env

# Ensure database is running
# Check DATABASE_URL in .env file
```

#### Permission Denied
**Cause**: Database user doesn't have proper permissions
**Solution**:
```bash
# Check database connection
npx prisma db pull

# Run migrations if needed
npx prisma migrate dev
```

## 📝 Script Customization

### Modifying Scripts for Different Users/Organizations

To use these scripts for different users or organizations, modify the following variables:

#### User Email
```typescript
const email = 'your-email@yourdomain.com';
```

#### Organization Domain
```typescript
const domain = 'yourdomain.com';
```

#### Organization Name
```typescript
const organizationName = 'Your Organization Name';
```

### Example: Custom User Activation
```typescript
// Modify activate-user.ts
const email = 'newuser@company.com';
const firstName = 'New';
const lastName = 'User';
const organizationName = 'Company Inc';
const domain = 'company.com';
```

## 🔒 Security Notes

- These scripts should only be used in development or by authorized administrators
- Scripts that modify user roles should be used with caution
- Always backup database before running scripts that modify data
- Test scripts in development environment before using in production

## 📚 Related Documentation

- [Project Management Fixes Summary](./project-management-fixes-summary.md)
- [Authentication Flow Guide](./authentication-flow-guide.md)
- [Database Schema Documentation](./database-schema.md)

## 🆘 Getting Help

If you encounter issues with these scripts:

1. Check the console output for error messages
2. Verify database connection and permissions
3. Ensure all environment variables are set correctly
4. Check the related documentation for troubleshooting steps
5. Review the script source code for specific error handling 