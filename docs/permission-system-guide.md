# 🔐 Permission System Guide

## Overview

The Alignzo platform implements a Role-Based Access Control (RBAC) system with standardized `resource.action` permissions enforced on both backend and frontend. Users see and perform only what their role's permissions allow.

## Architecture

### Core Components

1. **Permissions**: `resource.action` pairs (e.g., `users.create`)
2. **Roles**: Collections of permissions
3. **Users**: Assigned a role and organization context
4. **Guards**: Backend `PermissionGuard` and frontend permission guards

### Database Schema (simplified)

```sql
-- Roles can have many permissions
role_permissions (role_id, permission_id)

-- Users can have many roles (primary: one active org role)
user_roles (user_id, role_id)

-- Permissions define resource/action
permissions (id, name, resource, action, display_name, is_system)

-- Optional: direct, scoped user permissions
user_permissions (user_id, permission_id, scope jsonb, is_active)
```

## Frontend Implementation

### Permission Hook (`usePermissions`)

```typescript
import { usePermissions, PERMISSIONS } from '@/lib/permissions';

function MyComponent() {
  const { hasPermission, hasAnyPermission, hasRole } = usePermissions();

  const canCreateUsers = hasPermission('users', 'create');
  const canManageUsers = hasAnyPermission([
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
  ]);
  const isAdmin = hasRole('ADMIN');

  return (
    <div>
      {canCreateUsers && <button>Create User</button>}
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### Permission Constants (standardized)

```typescript
export const PERMISSIONS = {
  // Users
  USERS_CREATE: { resource: 'users', action: 'create' },
  USERS_READ: { resource: 'users', action: 'read' },
  USERS_UPDATE: { resource: 'users', action: 'update' },
  USERS_DELETE: { resource: 'users', action: 'delete' },
  USERS_ASSIGN_ROLE: { resource: 'users', action: 'assign_role' },
  USERS_REMOVE_ROLE: { resource: 'users', action: 'remove_role' },
  USERS_ASSIGN_MANAGER: { resource: 'users', action: 'assign_manager' },
  USERS_REMOVE_MANAGER: { resource: 'users', action: 'remove_manager' },

  // Roles
  ROLES_CREATE: { resource: 'roles', action: 'create' },
  ROLES_READ: { resource: 'roles', action: 'read' },
  ROLES_UPDATE: { resource: 'roles', action: 'update' },
  ROLES_DELETE: { resource: 'roles', action: 'delete' },
  ROLES_ASSIGN_PERMISSION: { resource: 'roles', action: 'assign_permission' },
  ROLES_UNASSIGN_PERMISSION: { resource: 'roles', action: 'unassign_permission' },

  // Projects
  PROJECTS_CREATE: { resource: 'projects', action: 'create' },
  PROJECTS_READ: { resource: 'projects', action: 'read' },
  PROJECTS_UPDATE: { resource: 'projects', action: 'update' },
  PROJECTS_DELETE: { resource: 'projects', action: 'delete' },

  // Teams
  TEAMS_CREATE: { resource: 'teams', action: 'create' },
  TEAMS_READ: { resource: 'teams', action: 'read' },
  TEAMS_UPDATE: { resource: 'teams', action: 'update' },
  TEAMS_DELETE: { resource: 'teams', action: 'delete' },

  // Time sessions
  TIME_SESSIONS_CREATE: { resource: 'time_sessions', action: 'create' },
  TIME_SESSIONS_READ: { resource: 'time_sessions', action: 'read' },
  TIME_SESSIONS_UPDATE: { resource: 'time_sessions', action: 'update' },
  TIME_SESSIONS_DELETE: { resource: 'time_sessions', action: 'delete' },

  // Work logs
  WORK_LOGS_CREATE: { resource: 'work_logs', action: 'create' },
  WORK_LOGS_READ: { resource: 'work_logs', action: 'read' },
  WORK_LOGS_UPDATE: { resource: 'work_logs', action: 'update' },
  WORK_LOGS_DELETE: { resource: 'work_logs', action: 'delete' },

  // System areas
  ORGANIZATIONS_READ: { resource: 'organizations', action: 'read' },
  ORGANIZATIONS_UPDATE: { resource: 'organizations', action: 'update' },
  SETTINGS_READ: { resource: 'settings', action: 'read' },
  SETTINGS_UPDATE: { resource: 'settings', action: 'update' },
  ANALYTICS_READ: { resource: 'analytics', action: 'read' },
} as const;
```

### Permission Guards

```tsx
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';

// Basic guard
<PermissionGuard permissions={[PERMISSIONS.USERS_CREATE]}>
  <CreateUserForm />
</PermissionGuard>
```

## Backend Implementation

### Controller Protection

```typescript
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, RequirePermissions } from '../common/guards/permission.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  @Post()
  @RequirePermissions('users', 'create')
  create(@Body() dto: CreateUserDto) { /* ... */ }

  @Get()
  @RequirePermissions('users', 'read')
  findAll() { /* ... */ }

  @Patch(':id')
  @RequirePermissions('users', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) { /* ... */ }
}
```

### Role Permission Assignment

- No CRUD UI for the `permissions` resource.
- Role permission changes require:
  - `roles.assign_permission` to add permissions to a role
  - `roles.unassign_permission` to remove permissions from a role

```typescript
@Post(':id/permissions')
@RequirePermissions('roles', 'assign_permission')
assignPermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto) { /* ... */ }
```

### Permissions API

- The permissions list endpoint exists for role editors but excludes the `permissions` resource server-side.
- This prevents the “permissions” resource from appearing in the Role modal filters.

## Access Levels

Users’ visibility is governed by access levels stored per-user:
- INDIVIDUAL, TEAM, PROJECT, FULL_ACCESS

Services apply access scoping for list/detail operations based on the requester’s access level.

## Best Practices

- Always protect endpoints with `@RequirePermissions`.
- Use standardized `resource.action` names end-to-end.
- Avoid relying on UI checks alone; backend is the source of truth.
- Do not expose `permissions.*` in UI; use role assign/unassign actions instead.

## Notes

- SUPER_ADMIN is seeded with all permissions and FULL_ACCESS.
- ADMIN gets read baselines by default; expand per org policy. 