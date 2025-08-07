'use client';

import { useAuth } from './auth-context';
import { useQuery } from '@tanstack/react-query';

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UserRole {
  id: string;
  role: {
    id: string;
    name: string;
    displayName: string;
    permissions: Permission[];
  };
}

export interface UserPermissions {
  permissions: Permission[];
  roles: UserRole[];
}

export function usePermissions() {
  const { apiCall, user } = useAuth();

  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: async (): Promise<UserPermissions> => {
      if (!user) {
        return { permissions: [], roles: [] };
      }

      try {
        // Fetch permissions directly from backend endpoint
        const response = await apiCall('/api/users/permissions/me');
        if (!response.ok) {
          throw new Error('Failed to fetch user permissions');
        }

        const data = await response.json();
        const parsedPermissions: Permission[] = (data.permissions || []).map((perm: string) => {
          const [resource, action] = perm.split('.');
          return {
            id: perm,
            name: perm,
            displayName: perm,
            resource,
            action,
          } as Permission;
        });
        return {
          permissions: parsedPermissions,
          roles: [], // Roles are not required for permission checks in the frontend currently
        };
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        return { permissions: [], roles: [] };
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasPermission = (resource: string, action: string): boolean => {
    if (!userPermissions?.permissions) return false;
    
    return userPermissions.permissions.some(
      permission => permission.resource === resource && permission.action === action
    );
  };

  const hasAnyPermission = (permissions: Array<{ resource: string; action: string }>): boolean => {
    return permissions.some(({ resource, action }) => hasPermission(resource, action));
  };

  const hasAllPermissions = (permissions: Array<{ resource: string; action: string }>): boolean => {
    return permissions.every(({ resource, action }) => hasPermission(resource, action));
  };

  const hasRole = (roleName: string): boolean => {
    if (!userPermissions?.roles) return false;
    
    return userPermissions.roles.some(userRole => userRole.role.name === roleName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  const getUserRoles = (): string[] => {
    if (!userPermissions?.roles) return [];
    
    return userPermissions.roles.map(userRole => userRole.role.name);
  };

  const getPermissions = (): Permission[] => {
    return userPermissions?.permissions || [];
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    getUserRoles,
    getPermissions,
    userPermissions,
    isLoading: !userPermissions,
  };
}

// Permission constants for consistent usage across the app
// Extended to include all resources with CRUD operations
export const PERMISSIONS = {
  // User Management Permissions (8 permissions)
  USERS_CREATE: { resource: 'users', action: 'create' },
  USERS_READ: { resource: 'users', action: 'read' },
  USERS_UPDATE: { resource: 'users', action: 'update' },
  USERS_DELETE: { resource: 'users', action: 'delete' },
  USERS_ASSIGN_ROLE: { resource: 'users', action: 'assign_role' },
  USERS_REMOVE_ROLE: { resource: 'users', action: 'remove_role' },
  USERS_ASSIGN_MANAGER: { resource: 'users', action: 'assign_manager' },
  USERS_REMOVE_MANAGER: { resource: 'users', action: 'remove_manager' },
  
  // Role Management Permissions (5 permissions)
  ROLES_CREATE: { resource: 'roles', action: 'create' },
  ROLES_READ: { resource: 'roles', action: 'read' },
  ROLES_UPDATE: { resource: 'roles', action: 'update' },
  ROLES_DELETE: { resource: 'roles', action: 'delete' },
  ROLES_MANAGE: { resource: 'roles', action: 'manage' },
  
  // Permission Management Permissions (5 permissions)
  PERMISSIONS_CREATE: { resource: 'permissions', action: 'create' },
  PERMISSIONS_READ: { resource: 'permissions', action: 'read' },
  PERMISSIONS_UPDATE: { resource: 'permissions', action: 'update' },
  PERMISSIONS_DELETE: { resource: 'permissions', action: 'delete' },
  PERMISSIONS_MANAGE: { resource: 'permissions', action: 'manage' },

  // Organization Management Permissions (4 permissions)
  ORGANIZATIONS_CREATE: { resource: 'organizations', action: 'create' },
  ORGANIZATIONS_READ: { resource: 'organizations', action: 'read' },
  ORGANIZATIONS_UPDATE: { resource: 'organizations', action: 'update' },
  ORGANIZATIONS_DELETE: { resource: 'organizations', action: 'delete' },

  // Project Management Permissions (4 permissions)
  PROJECTS_CREATE: { resource: 'projects', action: 'create' },
  PROJECTS_READ: { resource: 'projects', action: 'read' },
  PROJECTS_UPDATE: { resource: 'projects', action: 'update' },
  PROJECTS_DELETE: { resource: 'projects', action: 'delete' },

  // Team Management Permissions (4 permissions)
  TEAMS_CREATE: { resource: 'teams', action: 'create' },
  TEAMS_READ: { resource: 'teams', action: 'read' },
  TEAMS_UPDATE: { resource: 'teams', action: 'update' },
  TEAMS_DELETE: { resource: 'teams', action: 'delete' },

  // Time Session Management Permissions (4 permissions)
  TIME_SESSIONS_CREATE: { resource: 'time_sessions', action: 'create' },
  TIME_SESSIONS_READ: { resource: 'time_sessions', action: 'read' },
  TIME_SESSIONS_UPDATE: { resource: 'time_sessions', action: 'update' },
  TIME_SESSIONS_DELETE: { resource: 'time_sessions', action: 'delete' },

  // Work Log Management Permissions (4 permissions)
  WORK_LOGS_CREATE: { resource: 'work_logs', action: 'create' },
  WORK_LOGS_READ: { resource: 'work_logs', action: 'read' },
  WORK_LOGS_UPDATE: { resource: 'work_logs', action: 'update' },
  WORK_LOGS_DELETE: { resource: 'work_logs', action: 'delete' },

  // Analytics Permissions (4 permissions)
  ANALYTICS_CREATE: { resource: 'analytics', action: 'create' },
  ANALYTICS_READ: { resource: 'analytics', action: 'read' },
  ANALYTICS_UPDATE: { resource: 'analytics', action: 'update' },
  ANALYTICS_DELETE: { resource: 'analytics', action: 'delete' },

  // Settings Management Permissions (4 permissions)
  SETTINGS_CREATE: { resource: 'settings', action: 'create' },
  SETTINGS_READ: { resource: 'settings', action: 'read' },
  SETTINGS_UPDATE: { resource: 'settings', action: 'update' },
  SETTINGS_DELETE: { resource: 'settings', action: 'delete' },
} as const;

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const; 