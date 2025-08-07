# 🔗 API URL Standardization

This document outlines the standardization of API base URL usage across the Alignzo project.

---

## 📋 Overview

The project has been updated to use a standardized approach for API URL configuration and usage, ensuring consistency across all components and environments. This includes both backend API calls and Firebase authentication configuration.

---

## 🎯 Changes Made

### 1. Enhanced API Configuration (`frontend/src/configs/api.ts`)

**Before:**
```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  // ... endpoints
};
```

**After:**
```typescript
export const API_CONFIG = {
  // Base URL for API calls - supports multiple environments
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 
            (process.env.NODE_ENV === 'production' 
              ? 'https://api.alignzo.com' 
              : 'http://localhost:3001'),
  
  // API version for future versioning support
  VERSION: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
  
  // ... enhanced endpoints
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

// Helper function to get API endpoint with versioning support
export const getApiEndpoint = (endpoint: string): string => {
  return `/api/${API_CONFIG.VERSION}${endpoint}`;
};

// Helper function to build full API URL with versioning
export const buildVersionedApiUrl = (endpoint: string): string => {
  return buildApiUrl(getApiEndpoint(endpoint));
};
```

### 2. Standardized API Call Usage

**Before (Inconsistent):**
```typescript
// Some files used hardcoded URLs
const response = await apiCall('http://localhost:3001/api/users');

// Some files used relative paths
const response = await apiCall('/api/users');
```

**After (Standardized):**
```typescript
// All files now use relative paths with buildApiUrl
const response = await apiCall('/api/users');
```

### 3. Environment Configuration

**Frontend Environment Variables:**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_VERSION=v1

# Firebase Configuration (Required for Authentication)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCCOH7T907XnZoGxJaESLQghUE0xSDPiHk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dalignzo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dalignzo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dalignzo.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=901156603087
NEXT_PUBLIC_FIREBASE_APP_ID=1:901156603087:web:c95c9f4f714f8f0be263ba
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-36S66F65D6
```

**Backend Environment Variables:**
```bash
# API Configuration
API_URL=http://localhost:3001
API_VERSION=v1

# Firebase Admin SDK
FIREBASE_API_KEY=AIzaSyCCOH7T907XnZoGxJaESLQghUE0xSDPiHk
FIREBASE_AUTH_DOMAIN=dalignzo.firebaseapp.com
FIREBASE_PROJECT_ID=dalignzo
FIREBASE_STORAGE_BUCKET=dalignzo.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=901156603087
FIREBASE_APP_ID=1:901156603087:web:c95c9f4f714f8f0be263ba
FIREBASE_MEASUREMENT_ID=G-36S66F65D6
```

### 4. Firebase Configuration Standardization

**Backend Google OAuth Strategy:**
```typescript
// Before: Hardcoded callback URL
callbackURL: 'http://localhost:3001/api/auth/login/google/callback'

// After: Environment-aware callback URL
callbackURL: `${process.env.API_URL || 'http://localhost:3001'}/api/auth/login/google/callback`
```

---

## 🔧 Files Updated

### Frontend Components
- ✅ `frontend/src/components/forms/permission-form.tsx`
- ✅ `frontend/src/components/forms/user-form.tsx`
- ✅ `frontend/src/components/forms/role-form.tsx`
- ✅ `frontend/src/app/dashboard/permissions/page.tsx`
- ✅ `frontend/src/app/dashboard/roles/page.tsx`
- ✅ `frontend/src/app/dashboard/projects/page.tsx`
- ✅ `frontend/src/app/dashboard/time-tracking/page.tsx`
- ✅ `frontend/src/app/dashboard/work-logs/page.tsx`
- ✅ `frontend/src/lib/permissions.tsx`

### Backend Configuration
- ✅ `backend/src/auth/strategies/google.strategy.ts`

### Configuration Files
- ✅ `configs/development.env`
- ✅ `configs/frontend.env.example`

---

## 🚀 Benefits

### 1. Environment Flexibility
- **Development**: `http://localhost:3001`
- **Staging**: `https://staging-api.alignzo.com`
- **Production**: `https://api.alignzo.com`

### 2. Versioning Support
- Ready for API versioning (v1, v2, etc.)
- Backward compatibility support
- Easy migration path

### 3. Consistency
- All API calls use the same pattern
- Centralized configuration
- Easy to maintain and update

### 4. Security
- No hardcoded URLs in production
- Environment-specific configurations
- Proper CORS handling

### 5. Firebase Integration
- Consistent authentication across environments
- Proper OAuth callback URL handling
- Environment-aware Firebase configuration

---

## 📝 Usage Guidelines

### 1. Making API Calls

**✅ Correct Usage:**
```typescript
import { useAuth } from '@/lib/auth-context';

const { apiCall } = useAuth();

// Use relative paths
const response = await apiCall('/api/users');
const response = await apiCall(`/api/users/${userId}`);
const response = await apiCall('/api/projects', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

**❌ Avoid:**
```typescript
// Don't use hardcoded URLs
const response = await apiCall('http://localhost:3001/api/users');

// Don't use fetch directly (use apiCall instead)
const response = await fetch('/api/users');
```

### 2. Environment Configuration

**Development Setup:**
```bash
# 1. Copy the example environment file
cp configs/frontend.env.example frontend/.env.local

# 2. Update the Firebase configuration in frontend/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCCOH7T907XnZoGxJaESLQghUE0xSDPiHk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dalignzo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dalignzo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dalignzo.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=901156603087
NEXT_PUBLIC_FIREBASE_APP_ID=1:901156603087:web:c95c9f4f714f8f0be263ba
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-36S66F65D6

# 3. Set API configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_VERSION=v1
```

**Production Setup:**
```bash
# Set production environment variables
NEXT_PUBLIC_API_URL=https://api.alignzo.com
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_firebase_auth_domain
# ... other Firebase production values
```

### 3. Adding New Endpoints

**Update API Configuration:**
```typescript
// In frontend/src/configs/api.ts
export const API_CONFIG = {
  // ... existing config
  ENDPOINTS: {
    // ... existing endpoints
    NEW_FEATURE: {
      LIST: '/api/new-feature',
      CREATE: '/api/new-feature',
      UPDATE: (id: string) => `/api/new-feature/${id}`,
      DELETE: (id: string) => `/api/new-feature/${id}`,
    },
  },
};
```

**Use in Components:**
```typescript
import { API_CONFIG } from '@/configs/api';

const response = await apiCall(API_CONFIG.ENDPOINTS.NEW_FEATURE.LIST);
```

### 4. Firebase Authentication

**Using Firebase Auth:**
```typescript
import { signInWithGoogle, signOut } from '@/configs/firebase/firebase-config';

// Sign in with Google
try {
  const result = await signInWithGoogle();
  console.log('User signed in:', result.user);
} catch (error) {
  console.error('Sign-in error:', error);
}

// Sign out
try {
  await signOut();
  console.log('User signed out');
} catch (error) {
  console.error('Sign-out error:', error);
}
```

---

## 🔍 Testing

### 1. Verify API Calls
```bash
# Check if all API calls use relative paths
grep -r "http://localhost:3001" frontend/src/
# Should return no results
```

### 2. Test Environment Switching
```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev

# Production (simulated)
NEXT_PUBLIC_API_URL=https://api.alignzo.com npm run build
```

### 3. Verify Backend Configuration
```bash
# Check if backend uses environment variables
curl http://localhost:3001/api/health
```

### 4. Test Firebase Authentication
```bash
# Start the development server with Firebase config
npm run dev

# Try logging in with Google OAuth
# Should work without "api-key-not-valid" errors
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Firebase API Key Error
**Error:** `FirebaseError: Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`

**Solution:**
```bash
# 1. Create frontend/.env.local file
cp configs/frontend.env.example frontend/.env.local

# 2. Update Firebase configuration with actual values
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCCOH7T907XnZoGxJaESLQghUE0xSDPiHk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dalignzo.firebaseapp.com
# ... other Firebase values

# 3. Restart the development server
npm run dev
```

#### 2. Port Already in Use
**Error:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Kill existing processes on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use a different port
PORT=3002 npm run dev
```

#### 3. Environment Variables Not Loading
**Issue:** Environment variables not being read by Next.js

**Solution:**
```bash
# 1. Ensure .env.local is in the frontend directory
ls frontend/.env.local

# 2. Restart the development server
npm run dev

# 3. Check if variables are loaded
echo $NEXT_PUBLIC_FIREBASE_API_KEY
```

---

## 🚨 Migration Notes

### For Developers

1. **New Components**: Always use relative paths with `apiCall`
2. **Existing Components**: Already updated, no action needed
3. **Environment Setup**: Copy `configs/frontend.env.example` to `frontend/.env.local`
4. **Firebase Setup**: Ensure Firebase configuration is properly set in environment variables

### For Deployment

1. **Development**: Uses `configs/development.env`
2. **Staging**: Set `NEXT_PUBLIC_API_URL=https://staging-api.alignzo.com`
3. **Production**: Set `NEXT_PUBLIC_API_URL=https://api.alignzo.com`
4. **Firebase**: Use production Firebase project credentials

---

## 📚 Related Documentation

- [API Reference](./api-reference.md)
- [Development Guide](./development-guide.md)
- [Environment Configuration](./environment-setup.md)
- [Firebase Setup Guide](./firebase-setup.md)

---

## 🔄 Future Development Guidelines

### 1. API Development Checklist

When adding new API endpoints:

- [ ] Add endpoint to `frontend/src/configs/api.ts`
- [ ] Use relative paths in all API calls
- [ ] Test with different environments
- [ ] Update this documentation if needed

### 2. Frontend Development Checklist

When creating new components:

- [ ] Import `useAuth` for API calls
- [ ] Use `apiCall` instead of direct fetch
- [ ] Use relative paths for all API endpoints
- [ ] Test Firebase authentication if needed

### 3. Environment Setup Checklist

For new developers:

- [ ] Copy `configs/frontend.env.example` to `frontend/.env.local`
- [ ] Update Firebase configuration with actual values
- [ ] Set correct API URL for development
- [ ] Test both API calls and Firebase authentication

---

*This standardization ensures consistent API usage across all environments and makes the codebase more maintainable and secure. The Firebase configuration has been properly integrated to support authentication across all environments.* 