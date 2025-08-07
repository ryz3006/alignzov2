# 🔗 API Quick Reference

Quick reference guide for API URL standardization in Alignzo project.

---

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment file
cp configs/frontend.env.example frontend/.env.local

# Update with actual Firebase values
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCCOH7T907XnZoGxJaESLQghUE0xSDPiHk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dalignzo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dalignzo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dalignzo.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=901156603087
NEXT_PUBLIC_FIREBASE_APP_ID=1:901156603087:web:c95c9f4f714f8f0be263ba
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-36S66F65D6

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_VERSION=v1
```

### 2. Making API Calls
```typescript
import { useAuth } from '@/lib/auth-context';
import { API_CONFIG } from '@/configs/api';

const { apiCall } = useAuth();

// ✅ Correct - Use relative paths
const response = await apiCall('/api/users');
const response = await apiCall(`/api/users/${userId}`);

// ✅ Correct - Use API_CONFIG endpoints
const response = await apiCall(API_CONFIG.ENDPOINTS.USERS.LIST);
```

---

## 📋 API Endpoints Reference

### Authentication
```typescript
// Login with Google
await apiCall('/api/auth/google', {
  method: 'POST',
  body: JSON.stringify({ idToken: firebaseIdToken })
});

// Get current user
await apiCall('/api/auth/me');

// Refresh token
await apiCall('/api/auth/refresh');

// Logout
await apiCall('/api/auth/logout');
```

### Users
```typescript
// Get all users
await apiCall('/api/users');

// Get user by ID
await apiCall(`/api/users/${userId}`);

// Create user
await apiCall('/api/users', {
  method: 'POST',
  body: JSON.stringify(userData)
});

// Update user
await apiCall(`/api/users/${userId}`, {
  method: 'PATCH',
  body: JSON.stringify(updateData)
});

// Delete user
await apiCall(`/api/users/${userId}`, {
  method: 'DELETE'
});

// Assign role to user
await apiCall(`/api/users/${userId}/roles`, {
  method: 'POST',
  body: JSON.stringify({ roleId })
});
```

### Roles
```typescript
// Get all roles
await apiCall('/api/roles?includePermissions=true');

// Get role by ID
await apiCall(`/api/roles/${roleId}`);

// Create role
await apiCall('/api/roles', {
  method: 'POST',
  body: JSON.stringify(roleData)
});

// Update role
await apiCall(`/api/roles/${roleId}`, {
  method: 'PATCH',
  body: JSON.stringify(updateData)
});

// Delete role
await apiCall(`/api/roles/${roleId}`, {
  method: 'DELETE'
});

// Assign permissions to role
await apiCall(`/api/roles/${roleId}/permissions`, {
  method: 'POST',
  body: JSON.stringify({ permissionIds })
});
```

### Permissions
```typescript
// Get all permissions
await apiCall('/api/permissions');

// Get permission by ID
await apiCall(`/api/permissions/${permissionId}`);

// Create permission
await apiCall('/api/permissions', {
  method: 'POST',
  body: JSON.stringify(permissionData)
});

// Update permission
await apiCall(`/api/permissions/${permissionId}`, {
  method: 'PATCH',
  body: JSON.stringify(updateData)
});

// Delete permission
await apiCall(`/api/permissions/${permissionId}`, {
  method: 'DELETE'
});
```

### Projects
```typescript
// Get all projects
await apiCall('/api/projects');

// Get project by ID
await apiCall(`/api/projects/${projectId}`);

// Create project
await apiCall('/api/projects', {
  method: 'POST',
  body: JSON.stringify(projectData)
});

// Update project
await apiCall(`/api/projects/${projectId}`, {
  method: 'PATCH',
  body: JSON.stringify(updateData)
});

// Delete project
await apiCall(`/api/projects/${projectId}`, {
  method: 'DELETE'
});
```

### Time Sessions
```typescript
// Get all time sessions
await apiCall('/api/time-sessions');

// Get time session by ID
await apiCall(`/api/time-sessions/${sessionId}`);

// Start time session
await apiCall('/api/time-sessions', {
  method: 'POST',
  body: JSON.stringify({
    projectId,
    description: 'Working on project'
  })
});

// Pause time session
await apiCall(`/api/time-sessions/${sessionId}/pause`, {
  method: 'PATCH'
});

// Stop time session
await apiCall(`/api/time-sessions/${sessionId}/stop`, {
  method: 'PATCH'
});

// Update time session
await apiCall(`/api/time-sessions/${sessionId}`, {
  method: 'PATCH',
  body: JSON.stringify(updateData)
});

// Delete time session
await apiCall(`/api/time-sessions/${sessionId}`, {
  method: 'DELETE'
});
```

---

## 🔧 Helper Functions

### API Configuration
```typescript
import { API_CONFIG, buildApiUrl, getApiEndpoint, buildVersionedApiUrl } from '@/configs/api';

// Get base URL
console.log(API_CONFIG.BASE_URL); // http://localhost:3001

// Get API version
console.log(API_CONFIG.VERSION); // v1

// Build full API URL
const fullUrl = buildApiUrl('/api/users'); // http://localhost:3001/api/users

// Get versioned endpoint
const versionedEndpoint = getApiEndpoint('/users'); // /api/v1/users

// Build versioned API URL
const versionedUrl = buildVersionedApiUrl('/users'); // http://localhost:3001/api/v1/users
```

### Error Handling
```typescript
try {
  const response = await apiCall('/api/users');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'API call failed');
  }
  
  const data = await response.json();
  // Handle success
} catch (error) {
  console.error('API Error:', error);
  // Handle error
}
```

---

## 🚨 Common Issues & Solutions

### 1. Firebase API Key Error
```bash
# Error: Firebase: Error (auth/api-key-not-valid)
# Solution: Create frontend/.env.local with correct Firebase values
```

### 2. CORS Errors
```bash
# Error: Failed to fetch
# Solution: Ensure backend is running on port 3001
```

### 3. 401 Unauthorized
```bash
# Error: 401 Unauthorized
# Solution: Check if user is authenticated and token is valid
```

### 4. Port Already in Use
```bash
# Error: EADDRINUSE: address already in use :::3001
# Solution: Kill existing process or use different port
```

---

## 📝 Best Practices

### ✅ Do's
- Use relative paths for all API calls
- Use `apiCall` function from `useAuth`
- Handle errors properly
- Use TypeScript for type safety
- Test API calls in different environments

### ❌ Don'ts
- Don't use hardcoded URLs
- Don't use direct `fetch` calls
- Don't ignore error responses
- Don't commit environment files
- Don't use placeholder API keys

---

## 🔄 Environment Variables

### Development
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCCOH7T907XnZoGxJaESLQghUE0xSDPiHk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dalignzo.firebaseapp.com
```

### Production
```bash
NEXT_PUBLIC_API_URL=https://api.alignzo.com
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_firebase_domain
```

---

## 📚 Related Documentation

- [Full API Standardization Guide](./api-url-standardization.md)
- [Development Guide](./development-guide.md)
- [Environment Setup](./environment-setup.md)
- [Firebase Setup](./firebase-setup.md)

---

*This quick reference provides the essential information for working with the standardized API system. For detailed explanations, refer to the full documentation.* 