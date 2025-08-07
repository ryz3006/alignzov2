# Authentication Flow Guide

## 🎯 Overview

This document provides a comprehensive guide to the authentication flow in Alignzo V2, including the recent fixes for login redirect issues and organization validation.

---

## 🔄 **Authentication Flow Overview**

### **1. Initial Page Load**
```
User visits any page → AuthContext initializes → Check localStorage → Check Firebase auth state
```

### **2. Login Process**
```
User clicks "Sign in with Google" → Firebase authentication → Backend validation → JWT token generation → Redirect to dashboard
```

### **3. Organization Validation**
```
User email domain → Organization lookup → Validation → User creation/retrieval → Role assignment
```

---

## 🏗️ **Architecture Components**

### **Frontend Components**
- **AuthContext** (`frontend/src/lib/auth-context.tsx`): Central authentication state management
- **Login Page** (`frontend/src/app/login/page.tsx`): Google OAuth login interface
- **Main Page** (`frontend/src/app/page.tsx`): Initial routing logic
- **Dashboard Layout** (`frontend/src/components/layout/dashboard-layout.tsx`): Protected route wrapper

### **Backend Components**
- **Auth Service** (`backend/src/auth/auth.service.ts`): Authentication business logic
- **Auth Controller** (`backend/src/auth/auth.controller.ts`): API endpoints
- **JWT Guard** (`backend/src/auth/guards/jwt-auth.guard.ts`): Route protection
- **Organizations Service** (`backend/src/organizations/organizations.service.ts`): Domain validation

---

## 🔧 **Recent Fixes & Improvements**

### **1. Login Redirect Issue Resolution**

#### **Problem**
- Post-login success, users were not being redirected to the dashboard
- Race conditions between Firebase auth state and backend validation
- Duplicate auth state listeners causing conflicts

#### **Solution**
```typescript
// Consolidated auth state management
useEffect(() => {
  let isInitialLoad = true;
  
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Backend validation and user setup
      const userData = await authenticateWithBackend(firebaseUser);
      
      // Only redirect on initial load, not on subsequent auth state changes
      if (isInitialLoad) {
        router.push('/dashboard');
      }
    }
    
    isInitialLoad = false;
    setIsLoading(false);
  });
  
  return () => unsubscribe();
}, [router, queryClient]);
```

#### **Key Improvements**
- **Single Auth Listener**: Removed duplicate `onAuthStateChanged` listeners
- **Initial Load Flag**: Prevents multiple redirects on auth state changes
- **Proper Cleanup**: Ensures listener cleanup on component unmount

### **2. Organization Domain Validation**

#### **Problem**
- Users with unregistered domains could still login
- Automatic user creation for unauthorized domains

#### **Solution**
```typescript
// Backend validation before user creation
async loginWithGoogle(idToken: string): Promise<AuthResponseDto> {
  const firebaseUser = await this.validateFirebaseToken(idToken);
  
  // First, validate if the user's email domain is registered
  const organization = await this.organizationsService.validateUserDomain(firebaseUser.email);
  
  if (!organization) {
    throw new UnauthorizedException('Your organization is not registered in the system.');
  }
  
  // Proceed with user creation/retrieval only if organization is valid
  let user = await this.usersService.findByEmail(firebaseUser.email);
  // ... rest of the logic
}
```

### **3. Enhanced Error Handling**

#### **Specific Error Scenarios**
1. **Unauthorized Organization**: Redirect to `/unauthorized`
2. **Not Onboarded User**: Redirect to `/not-onboarded`
3. **Authentication Failures**: Redirect to `/login`

```typescript
// Frontend error handling
if (response.status === 401) {
  try {
    const error = JSON.parse(errorData);
    if (error.message?.includes('organization is not registered')) {
      router.push('/unauthorized');
    } else if (error.message?.includes('requires additional setup')) {
      router.push('/not-onboarded');
    } else {
      router.push('/login');
    }
  } catch (parseError) {
    router.push('/login');
  }
}
```

---

## 📱 **User Experience Flow**

### **1. New User (Valid Organization)**
```
1. Visit application → Redirected to login
2. Click "Sign in with Google" → Google OAuth
3. Backend validates organization domain → ✅ Valid
4. User created in system → JWT token generated
5. Redirected to dashboard → Success
```

### **2. Existing User (Valid Organization)**
```
1. Visit application → Check existing session
2. If session valid → Redirected to dashboard
3. If session expired → Redirected to login
4. Google OAuth → Backend validation → ✅ Valid
5. User retrieved → JWT token generated
6. Redirected to dashboard → Success
```

### **3. User with Unregistered Organization**
```
1. Visit application → Redirected to login
2. Click "Sign in with Google" → Google OAuth
3. Backend validates organization domain → ❌ Not registered
4. Error thrown → Redirected to /unauthorized
5. User sees "Organization not registered" message
```

### **4. User Not Properly Onboarded**
```
1. Visit application → Redirected to login
2. Click "Sign in with Google" → Google OAuth
3. Backend validation → User exists but not properly set up
4. Error thrown → Redirected to /not-onboarded
5. User sees onboarding instructions and contact information
```

---

## 🔒 **Security Features**

### **1. JWT Token Management**
- **Token Generation**: Secure JWT tokens with organization context
- **Token Refresh**: Automatic token refresh on expiration
- **Token Storage**: Secure localStorage management
- **Token Cleanup**: Proper cleanup on logout

### **2. Organization Validation**
- **Domain Verification**: Email domain must match registered organization
- **Multi-tenancy**: Complete isolation between organizations
- **Access Control**: Users can only access their organization's data

### **3. Route Protection**
- **JWT Guards**: All protected routes require valid JWT token
- **Role-based Access**: Different access levels based on user roles
- **Public Routes**: Properly marked routes that don't require authentication

---

## 🐛 **Troubleshooting Guide**

### **Common Issues**

#### **1. Login Redirect Not Working**
**Symptoms**: User logs in successfully but stays on login page
**Debug Steps**:
1. Check browser console for errors
2. Verify Firebase configuration
3. Check network tab for API calls
4. Verify backend is running and accessible

**Solutions**:
```typescript
// Add debugging to auth context
console.log('Firebase auth state changed:', firebaseUser?.email);
console.log('Backend authentication successful:', userData);
console.log('Redirecting to dashboard on initial load');
```

#### **2. Organization Validation Failing**
**Symptoms**: User gets "organization not registered" error
**Debug Steps**:
1. Check if organization exists in database
2. Verify email domain format
3. Check organization service logs
4. Verify domain normalization logic

**Solutions**:
```sql
-- Check organization in database
SELECT * FROM "Organization" WHERE domain = 'example.com';
```

#### **3. Token Refresh Issues**
**Symptoms**: User gets logged out unexpectedly
**Debug Steps**:
1. Check JWT secret configuration
2. Verify token expiration settings
3. Check refresh endpoint logs
4. Verify token storage in localStorage

**Solutions**:
```typescript
// Check token in localStorage
console.log('JWT token:', localStorage.getItem('jwt_token'));
```

### **Debug Mode**
Enable comprehensive logging by setting:
```bash
NODE_ENV=development
DEBUG=auth:*
```

---

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track**
1. **Login Success Rate**: Percentage of successful logins
2. **Organization Validation Failures**: Failed domain validations
3. **Token Refresh Rate**: How often tokens are refreshed
4. **User Onboarding Rate**: Users successfully onboarded

### **Logging Strategy**
```typescript
// Backend logging
this.logger.logAuthEvent('Starting Google login process...');
this.logger.warn('User attempted login with unauthorized domain', { 
  email: firebaseUser.email,
  domain: firebaseUser.email.split('@')[1]
});

// Frontend logging
console.log('Firebase auth state changed:', firebaseUser?.email);
console.log('Backend authentication successful:', userData);
```

---

## 🔮 **Future Enhancements**

### **Planned Improvements**
1. **Multi-Factor Authentication**: Additional security layers
2. **Session Management**: Better session tracking and management
3. **Audit Logging**: Comprehensive authentication event logging
4. **Rate Limiting**: Prevent brute force attacks

### **Performance Optimizations**
1. **Token Caching**: Optimize token storage and retrieval
2. **Lazy Loading**: Load authentication components on demand
3. **Connection Pooling**: Optimize database connections

---

## 📚 **Related Documentation**

- [Hierarchy Validation Summary](./hierarchy-validation-summary.md)
- [Organization Management Implementation](./organization-management-implementation.md)
- [API Reference](./api-reference.md)
- [Troubleshooting Guide](./troubleshooting-guide.md)

---

*Last Updated: December 2024*
*Version: 2.0* 