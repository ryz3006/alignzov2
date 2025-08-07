# 🔐 Access Management Guide

## Overview

This guide explains how to add new access types, manage permissions for roles, and extend the permission system in the Alignzo platform. The system provides a flexible and scalable approach to role-based access control (RBAC).

## Table of Contents

1. [Understanding the Current System](#understanding-the-current-system)
2. [Adding New Access Types](#adding-new-access-types)
3. [Managing Role Permissions](#managing-role-permissions)
4. [Creating Custom Roles](#creating-custom-roles)
5. [Extending the Permission System](#extending-the-permission-system)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Understanding the Current System

### Access Levels

The system currently supports four access levels defined in the `AccessLevel` enum:

```typescript
enum AccessLevel {
  FULL_ACCESS   // System-wide access
  PROJECT       // Access to specific projects
  TEAM          // Access to specific teams
  INDIVIDUAL    // Access to own data only
}
```

### Permission Structure

Permissions follow a `resource.action` pattern:

```typescript
interface Permission {
  name: string;           // e.g., "users.create"
  displayName: string;    // e.g., "Create Users"
  resource: string;       // e.g., "users"
  action: string;         // e.g., "create"
  description?: string;   // e.g., "Allow creating new users"
}
```

### Current Resources and Actions

| Resource | Actions | Description |
|----------|---------|-------------|
| `users` | create, read, update, delete | User management |
| `roles` | create, read, update, delete | Role management |
| `projects` | create, read, update, delete | Project management |
| `time_sessions` | create, read, update, delete | Time tracking |
| `teams` | create, read, update, delete | Team management |
| `system` | read, update | System settings |
| `organizations` | read, update | Organization settings |

## Adding New Access Types

### 1. Adding New Access Levels

To add a new access level:

#### Step 1: Update Database Schema

```sql
-- In database/schema.prisma
enum AccessLevel {
  FULL_ACCESS
  PROJECT
  TEAM
  INDIVIDUAL
  DEPARTMENT    // New access level
  REGION        // New access level
}
```

#### Step 2: Update Backend Types

```typescript
// In backend/src/roles/dto/create-role.dto.ts
export class CreateRoleDto {
  @IsEnum(['FULL_ACCESS', 'PROJECT', 'TEAM', 'INDIVIDUAL', 'DEPARTMENT', 'REGION'])
  level: AccessLevel;
}
```

#### Step 3: Update Frontend Constants

```typescript
// In frontend/src/components/forms/role-form.tsx
const ACCESS_LEVELS = [
  { value: 'FULL_ACCESS', label: 'Full Access', description: 'System-wide access' },
  { value: 'PROJECT', label: 'Project', description: 'Access to specific projects' },
  { value: 'TEAM', label: 'Team', description: 'Access to specific teams' },
  { value: 'INDIVIDUAL', label: 'Individual', description: 'Access to own data only' },
  { value: 'DEPARTMENT', label: 'Department', description: 'Access to department data' },
  { value: 'REGION', label: 'Region', description: 'Access to regional data' },
];
```

### 2. Adding New Resources

To add a new resource (e.g., `reports`):

#### Step 1: Create Permissions

```typescript
// Add to database seed or create via API
const newPermissions = [
  {
    name: 'reports.create',
    displayName: 'Create Reports',
    resource: 'reports',
    action: 'create',
    description: 'Allow creating new reports'
  },
  {
    name: 'reports.read',
    displayName: 'View Reports',
    resource: 'reports',
    action: 'read',
    description: 'Allow viewing reports'
  },
  {
    name: 'reports.update',
    displayName: 'Edit Reports',
    resource: 'reports',
    action: 'update',
    description: 'Allow editing existing reports'
  },
  {
    name: 'reports.delete',
    displayName: 'Delete Reports',
    resource: 'reports',
    action: 'delete',
    description: 'Allow deleting reports'
  },
  {
    name: 'reports.export',
    displayName: 'Export Reports',
    resource: 'reports',
    action: 'export',
    description: 'Allow exporting reports'
  }
];
```

#### Step 2: Update Permission Constants

```typescript
// In frontend/src/lib/permissions.ts
export const PERMISSIONS = {
  // ... existing permissions
  
  // Reports management
  REPORTS_CREATE: { resource: 'reports', action: 'create' },
  REPORTS_READ: { resource: 'reports', action: 'read' },
  REPORTS_UPDATE: { resource: 'reports', action: 'update' },
  REPORTS_DELETE: { resource: 'reports', action: 'delete' },
  REPORTS_EXPORT: { resource: 'reports', action: 'export' },
} as const;
```

#### Step 3: Add Permission Guards

```typescript
// In frontend/src/components/auth/permission-guard.tsx
export function ReportsPermissionGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard
      permissions={[PERMISSIONS.REPORTS_READ]}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

export function ReportsCreatePermissionGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard
      permissions={[PERMISSIONS.REPORTS_CREATE]}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

// Add similar guards for update, delete, export
```

#### Step 4: Update Resource Groups

```typescript
// In frontend/src/components/forms/role-form.tsx
const RESOURCE_GROUPS = {
  'User Management': ['users'],
  'Role Management': ['roles'],
  'Project Management': ['projects'],
  'Time Tracking': ['time_sessions'],
  'Team Management': ['teams'],
  'System Administration': ['system', 'organizations'],
  'Reporting': ['reports'], // New group
};
```

### 3. Adding New Actions

To add a new action (e.g., `approve`):

#### Step 1: Create Permissions with New Action

```typescript
const approvalPermissions = [
  {
    name: 'leave_requests.approve',
    displayName: 'Approve Leave Requests',
    resource: 'leave_requests',
    action: 'approve',
    description: 'Allow approving leave requests'
  },
  {
    name: 'expenses.approve',
    displayName: 'Approve Expenses',
    resource: 'expenses',
    action: 'approve',
    description: 'Allow approving expense reports'
  }
];
```

#### Step 2: Update Action Colors

```typescript
// In frontend/src/components/role-permission-manager.tsx
const ACTION_COLORS = {
  create: 'bg-green-100 text-green-800',
  read: 'bg-blue-100 text-blue-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
  export: 'bg-purple-100 text-purple-800',
  import: 'bg-indigo-100 text-indigo-800',
  approve: 'bg-emerald-100 text-emerald-800', // New action color
};
```

## Managing Role Permissions

### Using the Role Permission Manager

The system provides a dedicated interface for managing role permissions:

1. **Navigate to Roles Page**: Go to Dashboard → Roles
2. **Click Manage Permissions**: Click the key icon (🔑) next to any role
3. **Use the Permission Manager**:
   - **Search**: Find specific permissions
   - **Filter**: Filter by resource or action
   - **View Modes**: Toggle between "Assigned" and "All" permissions
   - **Bulk Operations**: Add/remove all permissions or by resource
   - **Individual Toggle**: Add/remove individual permissions

### Permission Management Features

#### Search and Filter
- **Search**: Search by permission name, display name, resource, or action
- **Resource Filter**: Filter permissions by specific resource (e.g., users, projects)
- **Action Filter**: Filter permissions by specific action (e.g., create, read)

#### Bulk Operations
- **Add All**: Assign all available permissions to the role
- **Remove All**: Remove all permissions from the role
- **Add Resource**: Add all permissions for a specific resource
- **Remove Resource**: Remove all permissions for a specific resource

#### Visual Indicators
- **Assigned Permissions**: Green background with checkmark
- **Unassigned Permissions**: White background with plus icon
- **Action Badges**: Color-coded badges for different actions
- **Resource Icons**: Visual icons for different resources

### Programmatic Permission Management

#### Backend API

```typescript
// Assign permissions to role
POST /api/roles/:roleId/permissions
{
  "permissionIds": ["permission-id-1", "permission-id-2"]
}

// Get role permissions
GET /api/roles/:roleId/permissions

// Remove specific permission
DELETE /api/roles/:roleId/permissions/:permissionId
```

#### Frontend Usage

```typescript
// Using the usePermissions hook
const { hasPermission, hasAnyPermission } = usePermissions();

// Check specific permission
const canCreateReports = hasPermission('reports', 'create');

// Check multiple permissions
const canManageReports = hasAnyPermission([
  PERMISSIONS.REPORTS_CREATE,
  PERMISSIONS.REPORTS_UPDATE,
  PERMISSIONS.REPORTS_DELETE
]);
```

## Creating Custom Roles

### 1. Define Role Requirements

Before creating a custom role, define:

- **Purpose**: What is the role for?
- **Access Level**: What scope of access is needed?
- **Permissions**: What specific actions should be allowed?
- **Users**: Who will be assigned this role?

### 2. Create the Role

#### Using the UI
1. Go to Dashboard → Roles
2. Click "Create Role"
3. Fill in role details:
   - **Role Name**: Use uppercase with underscores (e.g., `REPORT_MANAGER`)
   - **Display Name**: Human-readable name (e.g., "Report Manager")
   - **Description**: Explain the role's purpose
   - **Access Level**: Choose appropriate level
       - **Permissions**: Select required permissions
   
   **Note**: A user can only be assigned a single role. Assigning a new role to a user will override their existing role.
   
#### Using the API
```typescript
POST /api/roles
{
  "name": "REPORT_MANAGER",
  "displayName": "Report Manager",
  "description": "Manages reports and analytics",
  "level": "PROJECT",
  "isActive": true,
  "permissions": ["reports.read", "reports.create", "reports.export"]
}
```

### 3. Example Custom Roles

#### Project Manager Role
```typescript
{
  name: "PROJECT_MANAGER",
  displayName: "Project Manager",
  description: "Manages projects and team members",
  level: "PROJECT",
  permissions: [
    "projects.read",
    "projects.update",
    "projects.create",
    "team_members.read",
    "team_members.update",
    "time_sessions.read",
    "time_sessions.update"
  ]
}
```

#### HR Manager Role
```typescript
{
  name: "HR_MANAGER",
  displayName: "HR Manager",
  description: "Manages human resources and employee data",
  level: "TEAM",
  permissions: [
    "users.read",
    "users.update",
    "users.create",
    "leave_requests.read",
    "leave_requests.approve",
    "reports.read",
    "reports.export"
  ]
}
```

#### Finance Manager Role
```typescript
{
  name: "FINANCE_MANAGER",
  displayName: "Finance Manager",
  description: "Manages financial data and approvals",
  level: "DEPARTMENT",
  permissions: [
    "expenses.read",
    "expenses.approve",
    "reports.read",
    "reports.export",
    "budgets.read",
    "budgets.update"
  ]
}
```

## Extending the Permission System

### 1. Adding Context-Aware Permissions

For more granular control, you can implement context-aware permissions:

```typescript
// In the permission guard
interface ContextPermissionGuardProps {
  children: React.ReactNode;
  permission: { resource: string; action: string };
  context: {
    projectId?: string;
    teamId?: string;
    userId?: string;
  };
}

export function ContextPermissionGuard({ children, permission, context }: ContextPermissionGuardProps) {
  const { hasPermission } = usePermissions();
  
  // Check if user has permission in the given context
  const hasContextPermission = hasPermission(permission.resource, permission.action, context);
  
  return hasContextPermission ? <>{children}</> : null;
}
```

### 2. Implementing Permission Templates

Create predefined permission sets for common roles:

```typescript
// In frontend/src/lib/permission-templates.ts
export const PERMISSION_TEMPLATES = {
  READ_ONLY: {
    name: 'Read Only',
    description: 'Can only view data',
    permissions: [
      'users.read',
      'projects.read',
      'reports.read'
    ]
  },
  MANAGER: {
    name: 'Manager',
    description: 'Can manage teams and projects',
    permissions: [
      'users.read',
      'users.update',
      'projects.read',
      'projects.update',
      'projects.create',
      'team_members.read',
      'team_members.update'
    ]
  },
  ADMIN: {
    name: 'Administrator',
    description: 'Full administrative access',
    permissions: [
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'roles.create',
      'roles.read',
      'roles.update',
      'roles.delete',
      'permissions.read'
    ]
  }
};
```

### 3. Adding Time-Based Permissions

Implement temporary permissions with expiration:

```typescript
// In the database schema
model RolePermission {
  id              String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  roleId          String      @db.Uuid
  permissionId    String      @db.Uuid
  expiresAt       DateTime?   // New field for expiration
  createdAt       DateTime    @default(now())

  role            Role        @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission      Permission  @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}
```

## Best Practices

### 1. Permission Naming Conventions

- **Use lowercase** for resource and action names
- **Use singular** for resource names (e.g., `user` not `users`)
- **Use descriptive** action names (e.g., `approve` not `app`)
- **Be consistent** across the application

```typescript
// Good examples
'users.create'
'projects.update'
'leave_requests.approve'
'reports.export'

// Avoid
'Users.Create'
'project.update'
'leave.approve'
'report_export'
```

### 2. Role Design Principles

- **Principle of Least Privilege**: Grant minimum permissions necessary
- **Separation of Concerns**: Different roles for different responsibilities
- **Scalability**: Design roles that can grow with the organization
- **Maintainability**: Keep roles simple and well-documented

### 3. Security Considerations

- **Regular Audits**: Review permissions regularly
- **Documentation**: Document all custom roles and their purposes
- **Testing**: Test permission boundaries thoroughly
- **Monitoring**: Monitor permission usage and access patterns

### 4. Performance Optimization

- **Caching**: Cache permission checks for better performance
- **Indexing**: Ensure proper database indexing for permission queries
- **Lazy Loading**: Load permissions only when needed
- **Batch Operations**: Use batch operations for bulk permission changes

## Troubleshooting

### Common Issues

#### 1. Permissions Not Loading
```typescript
// Check if user has roles assigned
const { getUserRoles } = usePermissions();
console.log('User roles:', getUserRoles());

// Check if roles have permissions
const { getPermissions } = usePermissions();
console.log('User permissions:', getPermissions());
```

#### 2. UI Elements Not Showing
```typescript
// Verify permission constants are correct
import { PERMISSIONS } from '@/lib/permissions';
console.log('Permission constant:', PERMISSIONS.USERS_CREATE);

// Check permission guard usage
<UsersCreatePermissionGuard>
  <button>Create User</button>
</UsersCreatePermissionGuard>
```

#### 3. Backend Permission Errors
```typescript
// Check if user has required roles
@Roles('ADMIN', 'SUPER_ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
create(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}
```

### Debugging Tools

#### 1. Permission Debug Component
```typescript
// Create a debug component for development
function PermissionDebug() {
  const { hasPermission, getUserRoles, getPermissions } = usePermissions();
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Permission Debug</h3>
      <p>Roles: {getUserRoles().join(', ')}</p>
      <p>Permissions: {getPermissions().map(p => p.name).join(', ')}</p>
      <p>Can create users: {hasPermission('users', 'create') ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

#### 2. API Testing
```bash
# Test permission endpoints
curl -X GET "http://localhost:3001/api/roles/role-id/permissions" \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X POST "http://localhost:3001/api/roles/role-id/permissions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissionIds": ["permission-id-1", "permission-id-2"]}'
```

### Getting Help

If you encounter issues:

1. **Check the logs** for error messages
2. **Verify database** permissions are correctly assigned
3. **Test API endpoints** directly
4. **Review permission constants** for typos
5. **Check role assignments** for the user
6. **Consult the documentation** for best practices

## Conclusion

The Alignzo permission system is designed to be flexible and extensible. By following this guide, you can:

- Add new access types and resources
- Create custom roles with specific permissions
- Manage permissions effectively through the UI
- Extend the system for advanced use cases
- Maintain security and performance

Remember to always follow the principle of least privilege and regularly audit your permission assignments to ensure security and compliance. 