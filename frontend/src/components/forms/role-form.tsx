'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLoading } from '@/lib/loading-context';
import toast from 'react-hot-toast';
import { Search, Filter, Check, X, Plus, Shield, Users, Settings, Eye } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level?: 'FULL_ACCESS' | 'PROJECT' | 'TEAM' | 'INDIVIDUAL';
  isSystem: boolean;
  isActive: boolean;
  rolePermissions?: Array<{
    permission: {
      id: string;
      name: string;
      displayName: string;
      resource: string;
      action: string;
    };
  }>;
}

interface Permission {
  id: string;
  name: string;
  displayName: string;
  resource: string;
  action: string;
  description?: string;
}

interface FormData {
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  permissions: string[];
}

interface FormErrors {
  name?: string;
  displayName?: string;
  description?: string;
  level?: string;
  permissions?: string;
}

interface RoleFormProps {
  role?: Role;
  onSuccess: () => void;
  onCancel: () => void;
}

const ACCESS_LEVELS = [
  { value: 'FULL_ACCESS', label: 'Full Access', description: 'System-wide access', icon: Shield },
  { value: 'PROJECT', label: 'Project', description: 'Access to specific projects', icon: Settings },
  { value: 'TEAM', label: 'Team', description: 'Access to specific teams', icon: Users },
  { value: 'INDIVIDUAL', label: 'Individual', description: 'Access to own data only', icon: Eye },
];

const RESOURCE_GROUPS = {
  'User Management': ['users'],
  'Role Management': ['roles'],
  'Project Management': ['projects'],
  'Time Tracking': ['time_sessions'],
  'Team Management': ['teams'],
  'System Administration': ['organizations', 'settings', 'analytics'],
};

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-800',
  read: 'bg-blue-100 text-blue-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
  export: 'bg-purple-100 text-purple-800',
  import: 'bg-indigo-100 text-indigo-800',
  approve: 'bg-emerald-100 text-emerald-800',
};

const RESOURCE_COLORS = {
  users: 'bg-blue-100 text-blue-800',
  roles: 'bg-purple-100 text-purple-800',
  // permissions resource is not used in UI anymore
  projects: 'bg-green-100 text-green-800',
  time_sessions: 'bg-orange-100 text-orange-800',
  teams: 'bg-pink-100 text-pink-800',
  system: 'bg-red-100 text-red-800',
  organizations: 'bg-gray-100 text-gray-800',
};

export function RoleForm({ role, onSuccess, onCancel }: RoleFormProps) {
  const { apiCall } = useAuth();
  const { withLoading } = useLoading();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    displayName: '',
    description: '',
    isActive: true,
    permissions: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'assigned'>('all');

  // Fetch all permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await apiCall('/api/permissions');
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const data = await response.json();
      return data || [];
    },
  });

  // Fetch role permissions if editing
  const { data: rolePermissions = [] } = useQuery<Permission[]>({
    queryKey: ['role-permissions', role?.id],
    queryFn: async () => {
      if (!role?.id) return [];
      const response = await apiCall(`/api/roles/${role.id}/permissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch role permissions');
      }
      const data = await response.json();
      return data || [];
    },
    enabled: !!role?.id,
  });

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const as = [...a].sort();
    const bs = [...b].sort();
    for (let i = 0; i < as.length; i++) {
      if (as[i] !== bs[i]) return false;
    }
    return true;
  };

  const isSameFormData = (prev: FormData, next: FormData) => {
    return (
      prev.name === next.name &&
      prev.displayName === next.displayName &&
      prev.description === next.description &&
      prev.isActive === next.isActive &&
      arraysEqual(prev.permissions, next.permissions)
    );
  };

  useEffect(() => {
    if (!role) return;
    const nextData: FormData = {
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      isActive: role.isActive,
      permissions: (rolePermissions || []).map(p => p.id),
    };

    setFormData(prev => (isSameFormData(prev, nextData) ? prev : nextData));
  }, [role, rolePermissions]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (!/^[A-Z_]+$/.test(formData.name)) {
      newErrors.name = 'Role name must be uppercase with underscores only';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length > 100) {
      newErrors.displayName = 'Display name must be 100 characters or less';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createRoleMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { permissions, ...roleData } = data;
      const response = await apiCall('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...roleData,
          permissions: permissions,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create role');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { permissions, ...roleData } = data;
      const response = await apiCall(`/api/roles/${role!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...roleData,
          permissions: permissions,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Role updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update role');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await withLoading(async () => {
      if (role) {
        await updateRoleMutation.mutateAsync(formData);
      } else {
        await createRoleMutation.mutateAsync(formData);
      }
    });
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const handleSelectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: permissions.map(p => p.id),
    }));
  };

  const handleClearAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: [],
    }));
  };

  const handleSelectResourcePermissions = (resource: string) => {
    const resourcePermissions = permissions.filter(p => p.resource === resource);
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    
    setFormData(prev => ({
      ...prev,
      permissions: [...new Set([...prev.permissions, ...resourcePermissionIds])],
    }));
  };

  const handleClearResourcePermissions = (resource: string) => {
    const resourcePermissions = permissions.filter(p => p.resource === resource);
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.filter(id => !resourcePermissionIds.includes(id)),
    }));
  };

  const filteredPermissions = permissions.filter(permission => {
    // Hide permissions resource since there is no UI to manage it
    if (permission.resource === 'permissions') return false;

    const matchesSearch = (permission.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (permission.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (permission.resource?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (permission.action?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesResource = selectedResource === 'all' || permission.resource === selectedResource;
    const matchesAction = selectedAction === 'all' || permission.action === selectedAction;
    
    const isAssigned = formData.permissions.includes(permission.id);
    const matchesViewMode = viewMode === 'all' || (viewMode === 'assigned' && isAssigned);
    
    return matchesSearch && matchesResource && matchesAction && matchesViewMode;
  });

  const groupedPermissions = filteredPermissions.reduce((groups, permission) => {
    const group = permission.resource;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending;

  // Get unique resources and actions for filters
  const resources = Array.from(new Set(filteredPermissions.map(p => p.resource)))
    .filter(r => r !== 'permissions')
    .sort() as string[];
  const actions = Array.from(new Set(filteredPermissions.map(p => p.action))).sort() as string[];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Role Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Role Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Role Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value.toUpperCase())}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="e.g., PROJECT_MANAGER"
              disabled={role?.isSystem}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Use uppercase letters and underscores only
            </p>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.displayName ? 'border-red-500' : ''
              }`}
              placeholder="e.g., Project Manager"
            />
            {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.description ? 'border-red-500' : ''
            }`}
            placeholder="Describe the role's purpose and responsibilities..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active Role
            </label>
          </div>
        </div>
      </div>

      {/* Permission Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleSelectAllPermissions}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAllPermissions}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search Permissions
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search permissions..."
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="resource-filter" className="block text-sm font-medium text-gray-700">
              Resource
            </label>
            <select
              id="resource-filter"
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Resources</option>
              {resources.map(resource => (
                <option key={resource} value={resource}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700">
              Action
            </label>
            <select
              id="action-filter"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Actions</option>
              {actions.map(action => (
                <option key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="view-mode" className="block text-sm font-medium text-gray-700">
              View Mode
            </label>
            <select
              id="view-mode"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'all' | 'assigned')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Permissions</option>
              <option value="assigned">Assigned Only</option>
            </select>
          </div>
        </div>

        {/* Permission Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {formData.permissions.length} of {permissions.length} permissions
            </p>
            <div className="flex space-x-2">
              {Object.entries(RESOURCE_GROUPS).map(([groupName, groupResources]) => {
                const groupPermissions = permissions.filter(p => groupResources.includes(p.resource));
                const selectedGroupPermissions = formData.permissions.filter(id => 
                  groupPermissions.some(p => p.id === id)
                );
                if (groupPermissions.length === 0) return null;
                
                return (
                  <div key={groupName} className="text-xs text-blue-600">
                    {groupName}: {selectedGroupPermissions.length}/{groupPermissions.length}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Permission Groups */}
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => {
            const selectedCount = resourcePermissions.filter(p => formData.permissions.includes(p.id)).length;
            const totalCount = resourcePermissions.length;

            return (
              <div key={resource} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Resource Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${RESOURCE_COLORS[resource as keyof typeof RESOURCE_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                        {resource.replace('_', ' ').toUpperCase()}
                      </span>
                      <h4 className="text-sm font-medium text-gray-900">
                        {selectedCount} of {totalCount} permissions selected
                      </h4>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSelectResourcePermissions(resource)}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearResourcePermissions(resource)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Permissions List */}
                <div className="divide-y divide-gray-100">
                  {resourcePermissions.map(permission => {
                    const isSelected = formData.permissions.includes(permission.id);
                    return (
                      <div
                        key={permission.id}
                        className={`px-4 py-4 transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-l-4 border-l-blue-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-gray-900 leading-tight">
                                {permission.displayName}
                              </h5>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${ACTION_COLORS[permission.action as keyof typeof ACTION_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                                {permission.action.toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 font-mono">
                                {permission.name}
                              </p>
                              {permission.description && (
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPermissions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No permissions found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || permissionsLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
        </button>
      </div>
    </form>
  );
} 