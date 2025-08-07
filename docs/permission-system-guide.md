# 🔐 Permission System Guide

## Overview

The Alignzo platform implements a comprehensive Role-Based Access Control (RBAC) system that provides granular permission management across the entire application. This system ensures that users can only access features and perform actions they are authorized for.

## Architecture

### Core Components

1. **Permissions**: Granular access controls for specific resources and actions
2. **Roles**: Collections of permissions that define user capabilities
3. **Users**: Individual users who are assigned roles
4. **Permission Guards**: React components that conditionally render UI based on permissions

### Database Schema

```sql
-- Users can have multiple roles
UserRole {
  userId: UUID
  roleId: UUID
  grantedAt: DateTime
  isActive: Boolean
}

-- Roles can have multiple permissions
RolePermission {
  roleId: UUID
  permissionId: UUID
  createdAt: DateTime
}

-- Permissions define resource.action combinations
Permission {
  name: String (e.g., "users.create")
  displayName: String
  resource: String (e.g., "users")
  action: String (e.g., "create")
  description: String
}
```

## Frontend Implementation

### Permission Hook (`usePermissions`)

The `usePermissions` hook provides a centralized way to check user permissions throughout the application.

```typescript
import { usePermissions, PERMISSIONS } from '@/lib/permissions';

function MyComponent() {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    getUserRoles,
    getPermissions 
  } = usePermissions();

  // Check specific permission
  const canCreateUsers = hasPermission('users', 'create');
  
  // Check multiple permissions (any)
  const canManageUsers = hasAnyPermission([
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE
  ]);

  // Check multiple permissions (all)
  const canFullyManageUsers = hasAllPermissions([
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE
  ]);

  // Check roles
  const isAdmin = hasRole('ADMIN');
  const isAdminOrSuperAdmin = hasAnyRole(['ADMIN', 'SUPER_ADMIN']);

  return (
    <div>
      {canCreateUsers && <button>Create User</button>}
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### Permission Constants

Standardized permission definitions for consistent usage:

```typescript
export const PERMISSIONS = {
  // User management
  USERS_CREATE: { resource: 'users', action: 'create' },
  USERS_READ: { resource: 'users', action: 'read' },
  USERS_UPDATE: { resource: 'users', action: 'update' },
  USERS_DELETE: { resource: 'users', action: 'delete' },
  
  // Role management
  ROLES_CREATE: { resource: 'roles', action: 'create' },
  ROLES_READ: { resource: 'roles', action: 'read' },
  ROLES_UPDATE: { resource: 'roles', action: 'update' },
  ROLES_DELETE: { resource: 'roles', action: 'delete' },
  
  // Permission management
  PERMISSIONS_CREATE: { resource: 'permissions', action: 'create' },
  PERMISSIONS_READ: { resource: 'permissions', action: 'read' },
  PERMISSIONS_UPDATE: { resource: 'permissions', action: 'update' },
  PERMISSIONS_DELETE: { resource: 'permissions', action: 'delete' },
  
  // Project management
  PROJECTS_CREATE: { resource: 'projects', action: 'create' },
  PROJECTS_READ: { resource: 'projects', action: 'read' },
  PROJECTS_UPDATE: { resource: 'projects', action: 'update' },
  PROJECTS_DELETE: { resource: 'projects', action: 'delete' },
  
  // Time tracking
  TIME_SESSIONS_CREATE: { resource: 'time_sessions', action: 'create' },
  TIME_SESSIONS_READ: { resource: 'time_sessions', action: 'read' },
  TIME_SESSIONS_UPDATE: { resource: 'time_sessions', action: 'update' },
  TIME_SESSIONS_DELETE: { resource: 'time_sessions', action: 'delete' },
} as const;
```

### Permission Guards

Reusable components that conditionally render content based on permissions:

```typescript
import { 
  PermissionGuard,
  UsersPermissionGuard,
  UsersCreatePermissionGuard,
  AdminRoleGuard 
} from '@/components/auth/permission-guard';

// Basic permission guard
<PermissionGuard 
  permissions={[PERMISSIONS.USERS_CREATE]}
  roles={['ADMIN', 'SUPER_ADMIN']}
  requireAll={false}
  fallback={<p>Access denied</p>}
>
  <CreateUserForm />
</PermissionGuard>

// Convenience guards
<UsersPermissionGuard>
  <UsersPage />
</UsersPermissionGuard>

<UsersCreatePermissionGuard>
  <button>Create User</button>
</UsersCreatePermissionGuard>

<AdminRoleGuard>
  <AdminPanel />
</AdminRoleGuard>
```

## Backend Implementation

### Role Assignment Endpoints

```typescript
// Assign role to user
POST /api/users/:id/roles
Body: { roleId: string }

// Remove role from user
DELETE /api/users/:id/roles/:roleId

// Get user roles
GET /api/users/:id/roles
```

### Permission Checking in Controllers

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  
  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN') // Role-based access
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  // No @Roles decorator - accessible to all authenticated users
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN') // Only super admins can delete users
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

## Usage Examples

### 1. Protecting Entire Pages

```typescript
// pages/dashboard/users/page.tsx
export default function UsersPage() {
  return (
    <DashboardLayout>
      <UsersPermissionGuard>
        <div className="space-y-6">
          {/* Page content */}
        </div>
      </UsersPermissionGuard>
    </DashboardLayout>
  );
}
```

### 2. Protecting Specific Actions

```typescript
// In a component
function UserActions({ user }) {
  return (
    <div className="flex space-x-2">
      <UsersUpdatePermissionGuard>
        <button onClick={() => editUser(user)}>
          <Edit className="h-4 w-4" />
        </button>
      </UsersUpdatePermissionGuard>
      
      <UsersDeletePermissionGuard>
        <button onClick={() => deleteUser(user.id)}>
          <Trash2 className="h-4 w-4" />
        </button>
      </UsersDeletePermissionGuard>
    </div>
  );
}
```

### 3. Conditional Rendering Based on Permissions

```typescript
function UserManagement() {
  const { hasPermission, hasAnyRole } = usePermissions();
  
  return (
    <div>
      <h1>User Management</h1>
      
      {hasPermission('users', 'create') && (
        <button>Create New User</button>
      )}
      
      {hasAnyRole(['ADMIN', 'SUPER_ADMIN']) && (
        <AdminTools />
      )}
      
      <UserList />
    </div>
  );
}
```

### 4. Form-Level Permission Checking

```typescript
function UserForm({ user }) {
  const { hasPermission } = usePermissions();
  const canEditEmail = hasPermission('users', 'update') && !user?.isSystem;
  
  return (
    <form>
      <input 
        type="email" 
        disabled={!canEditEmail}
        placeholder="Email"
      />
      {/* Other form fields */}
    </form>
  );
}
```

## Best Practices

### 1. Always Use Permission Guards

Instead of manual permission checking, use the provided guard components:

```typescript
// ❌ Don't do this
{hasPermission('users', 'create') && <CreateButton />}

// ✅ Do this
<UsersCreatePermissionGuard>
  <CreateButton />
</UsersCreatePermissionGuard>
```

### 2. Use Permission Constants

Always use the predefined permission constants instead of hardcoding strings:

```typescript
// ❌ Don't do this
hasPermission('users', 'create')

// ✅ Do this
hasPermission(PERMISSIONS.USERS_CREATE.resource, PERMISSIONS.USERS_CREATE.action)
// or
hasAnyPermission([PERMISSIONS.USERS_CREATE])
```

### 3. Provide Fallback Content

Always provide meaningful fallback content for permission guards:

```typescript
<UsersCreatePermissionGuard fallback={
  <div className="text-center py-8">
    <p className="text-gray-500">You don't have permission to create users.</p>
    <p className="text-sm text-gray-400">Contact your administrator for access.</p>
  </div>
}>
  <CreateUserForm />
</UsersCreatePermissionGuard>
```

### 4. Cache Permission Data

The permission system automatically caches user permissions for 5 minutes to improve performance. The cache is invalidated when:

- User logs out
- User roles are updated
- Cache expires

### 5. Handle Loading States

Always handle the loading state of permissions:

```typescript
function MyComponent() {
  const { isLoading, hasPermission } = usePermissions();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div>
      {hasPermission('users', 'create') && <CreateButton />}
    </div>
  );
}
```

## Security Considerations

### 1. Backend Validation

Always validate permissions on the backend, even if the frontend hides UI elements:

```typescript
// Frontend can be bypassed, so backend validation is crucial
@Post()
@Roles('ADMIN', 'SUPER_ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
create(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}
```

### 2. Role Hierarchy

The system supports role hierarchy where higher-level roles inherit permissions from lower-level roles:

- SUPER_ADMIN: Full access to everything
- ADMIN: Full access to most features
- MANAGER: Team and project management
- EMPLOYEE: Basic access to assigned resources

### 3. System Protection

System roles and permissions are protected from deletion:

```typescript
// System roles cannot be deleted
if (role.isSystem) {
  throw new BadRequestException('Cannot delete system role');
}
```

## Troubleshooting

### Common Issues

1. **Permissions not loading**: Check if the user has roles assigned
2. **UI elements not showing**: Verify permission constants are correct
3. **Backend errors**: Ensure user has required roles for the endpoint

### Debugging

Enable permission debugging by adding console logs:

```typescript
function MyComponent() {
  const { hasPermission, getUserRoles, getPermissions } = usePermissions();
  
  console.log('User roles:', getUserRoles());
  console.log('User permissions:', getPermissions());
  console.log('Can create users:', hasPermission('users', 'create'));
  
  return <div>...</div>;
}
```

## Future Enhancements

1. **Permission Groups**: Group related permissions for easier management
2. **Temporary Permissions**: Time-limited permission grants
3. **Permission Auditing**: Track permission changes and usage
4. **Dynamic Permissions**: Context-aware permission checking
5. **Permission Templates**: Predefined permission sets for common roles 