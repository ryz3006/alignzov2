# 🔧 RBAC Troubleshooting Guide

## 🚨 Common Issues & Solutions

### React Hooks Errors

#### React Hooks Order Violation
**Error Message**: 
```
Error: React has detected a change in the order of Hooks called by [ComponentName]. 
This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks.
```

**Root Cause**: 
- Hooks are called conditionally (inside if statements, loops, or nested functions)
- Early returns happen before all hooks are called
- Hook order changes between renders

**Solution**:
1. **Always call hooks at the top level** of your component
2. **Never call hooks inside conditions, loops, or nested functions**
3. **Ensure all hooks are called in the same order every render**

**Example Fix**:
```tsx
// ❌ WRONG - Conditional hook calls
function MyComponent({ condition }) {
  if (condition) {
    useEffect(() => {}, []); // This violates Rules of Hooks
  }
  return <div>Content</div>;
}

// ✅ CORRECT - All hooks called unconditionally
function MyComponent({ condition }) {
  useEffect(() => {
    if (condition) {
      // Do something
    }
  }, [condition]); // Handle condition inside the hook
  return <div>Content</div>;
}
```

**Prevention Tips**:
- Use ESLint rules: `eslint-plugin-react-hooks`
- Test components with different prop combinations
- Review components that use early returns
- Ensure all hooks are called before any conditional logic

#### Hook Dependencies Issues
**Error Message**: 
```
React Hook useEffect has missing dependencies: [dependencyName]. 
Either include it or remove the dependency array.
```

**Solution**:
1. **Include all dependencies** used inside the hook
2. **Use useCallback/useMemo** for function/object dependencies
3. **Consider if the dependency is actually needed**

**Example**:
```tsx
// ❌ WRONG - Missing dependency
useEffect(() => {
  fetchData(user.id);
}, []); // Missing user.id dependency

// ✅ CORRECT - Include all dependencies
useEffect(() => {
  fetchData(user.id);
}, [user.id]);

// ✅ CORRECT - Use useCallback for functions
const fetchData = useCallback((id) => {
  // fetch logic
}, []);

useEffect(() => {
  fetchData(user.id);
}, [fetchData, user.id]);
```

### Authentication Issues

#### 401 Unauthorized Errors
**Symptoms**: 
- API calls returning 401 status
- Users redirected to login page unexpectedly
- Token refresh not working

**Troubleshooting Steps**:
1. **Check token storage**: Verify JWT token is stored in localStorage
2. **Check token expiration**: Ensure token hasn't expired
3. **Check token refresh**: Verify automatic token refresh is working
4. **Check backend authentication**: Verify Firebase Admin SDK is configured
5. **Check CORS settings**: Ensure frontend can access backend

**Debug Commands**:
```javascript
// Check localStorage
console.log('Token:', localStorage.getItem('jwt_token'));
console.log('User:', localStorage.getItem('user'));

// Check network requests
// Open browser DevTools → Network tab → Look for 401 responses
```

#### Firebase Authentication Issues
**Symptoms**:
- Google sign-in not working
- Firebase initialization errors
- Backend can't verify Firebase tokens

**Troubleshooting Steps**:
1. **Check Firebase config**: Verify service account JSON is properly configured
2. **Check environment variables**: Ensure all Firebase config is set
3. **Check Firebase console**: Verify project settings and OAuth configuration
4. **Check backend logs**: Look for Firebase Admin SDK errors

### Permission Issues

#### Users Can't Access Pages
**Symptoms**:
- Users see "unauthorized" page
- Navigation items not showing
- Permission checks failing

**Troubleshooting Steps**:
1. **Check user roles**: Verify user has assigned roles in database
2. **Check role permissions**: Verify roles have required permissions
3. **Check permission constants**: Ensure frontend uses correct permission names
4. **Check API responses**: Verify user roles API returns correct data

**Debug Commands**:
```javascript
// Check user permissions in browser console
const { userPermissions } = usePermissions();
console.log('User Permissions:', userPermissions);

// Check user roles
const { getUserRoles } = usePermissions();
console.log('User Roles:', getUserRoles());
```

#### Role Assignment Issues
**Symptoms**:
- Users can't be assigned roles
- Role changes not persisting
- Role assignment modal not working

**Troubleshooting Steps**:
1. **Check API endpoints**: Verify role assignment endpoints are working
2. **Check database**: Verify userRoles table has correct data
3. **Check permissions**: Ensure user has permission to assign roles
4. **Check frontend state**: Verify role assignment updates UI state

### Database Issues

#### Prisma Connection Errors
**Symptoms**:
- Database connection failed
- Prisma client not generated
- Migration errors

**Troubleshooting Steps**:
1. **Check database status**: Ensure PostgreSQL is running
2. **Check connection string**: Verify DATABASE_URL in environment
3. **Regenerate Prisma client**: Run `npx prisma generate`
4. **Check migrations**: Run `npx prisma migrate dev`

**Debug Commands**:
```bash
# Check database connection
npx prisma db push

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

#### Seeding Issues
**Symptoms**:
- Database not seeded with initial data
- Missing roles/permissions
- Super admin user not created

**Troubleshooting Steps**:
1. **Check seed script**: Verify seed.ts file is correct
2. **Run seed manually**: Execute `npm run db:seed`
3. **Check database**: Verify data exists in tables
4. **Check constraints**: Ensure no unique constraint violations

### Frontend Issues

#### Component Rendering Issues
**Symptoms**:
- Components not rendering
- Infinite loading states
- React errors in console

**Troubleshooting Steps**:
1. **Check component props**: Verify all required props are passed
2. **Check conditional rendering**: Ensure conditions are properly evaluated
3. **Check loading states**: Verify loading logic is correct
4. **Check error boundaries**: Ensure errors are properly caught

#### State Management Issues
**Symptoms**:
- State not updating
- Components not re-rendering
- Stale data displayed

**Troubleshooting Steps**:
1. **Check state updates**: Verify setState calls are working
2. **Check dependencies**: Ensure useEffect dependencies are correct
3. **Check context providers**: Verify context is properly provided
4. **Check React Query**: Verify query invalidation and refetching

## 🔍 Debugging Tools

### Browser DevTools
1. **Console**: Check for JavaScript errors and logs
2. **Network**: Monitor API calls and responses
3. **Application**: Check localStorage and sessionStorage
4. **React DevTools**: Inspect component state and props

### Backend Logging
```typescript
// Add comprehensive logging
console.log('Auth check for user:', user.email);
console.log('User roles:', userRoles);
console.log('Permission check:', { resource, action, hasPermission });
```

### Database Inspection
```sql
-- Check user roles
SELECT u.email, r.name as role_name 
FROM users u 
JOIN userRoles ur ON u.id = ur.userId 
JOIN roles r ON ur.roleId = r.id;

-- Check role permissions
SELECT r.name as role_name, p.resource, p.action 
FROM roles r 
JOIN rolePermissions rp ON r.id = rp.roleId 
JOIN permissions p ON rp.permissionId = p.id;
```

## 📋 Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "React has detected a change in the order of Hooks" | Conditional hook calls | Move all hooks to top level |
| "401 Unauthorized" | Invalid/missing token | Check token storage and refresh |
| "Failed to fetch user permissions" | API endpoint error | Check backend authentication |
| "User not found" | Database connection issue | Check database and user seeding |
| "Permission denied" | Missing role/permission | Check user role assignment |

## 🚀 Performance Issues

### Slow Permission Checks
**Symptoms**: 
- Permission checks taking too long
- UI lag during navigation
- Slow page loads

**Solutions**:
1. **Cache permissions**: Use React Query for caching
2. **Optimize queries**: Reduce database calls
3. **Lazy load**: Load permissions only when needed
4. **Use memoization**: Cache permission check results

### Memory Leaks
**Symptoms**:
- Increasing memory usage
- Components not unmounting properly
- Event listeners not cleaned up

**Solutions**:
1. **Cleanup effects**: Return cleanup functions from useEffect
2. **Remove listeners**: Clean up event listeners
3. **Unsubscribe**: Cancel subscriptions and timers
4. **Use AbortController**: Cancel fetch requests

## 📞 Getting Help

### Before Asking for Help
1. **Check this guide**: Look for similar issues
2. **Check logs**: Review browser console and backend logs
3. **Reproduce issue**: Create minimal reproduction case
4. **Check recent changes**: Identify what might have caused the issue

### Information to Provide
- **Error message**: Exact error text
- **Steps to reproduce**: Clear reproduction steps
- **Environment**: Browser, OS, Node.js version
- **Recent changes**: What was changed recently
- **Logs**: Relevant console and backend logs

### Support Channels
- **Documentation**: Check project docs first
- **GitHub Issues**: Create detailed issue reports
- **Team Chat**: Ask in team communication channels
- **Code Review**: Request code review for complex changes

---

*This troubleshooting guide should help resolve most common RBAC and React issues. For additional help, refer to the main project documentation.* 