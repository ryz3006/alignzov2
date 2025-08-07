'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLoading } from '@/lib/loading-context';
import toast from 'react-hot-toast';
import { Search, Filter, Check, X, Plus, Minus, Shield, Users, Settings, Building2, FolderOpen, Clock, FileText, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: 'FULL_ACCESS' | 'PROJECT' | 'TEAM' | 'INDIVIDUAL';
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

interface RolePermissionManagerProps {
  role: Role;
  onClose: () => void;
}

const RESOURCE_ICONS = {
  users: Users,
  roles: Shield,
  permissions: Settings,
  organizations: Building2,
  projects: FolderOpen,
  teams: Users,
  time_sessions: Clock,
  work_logs: FileText,
  analytics: BarChart3,
  settings: Settings,
  system: Settings,
};

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-800',
  read: 'bg-blue-100 text-blue-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
  export: 'bg-purple-100 text-purple-800',
  import: 'bg-indigo-100 text-indigo-800',
};

export function RolePermissionManager({ role, onClose }: RolePermissionManagerProps) {
  const { apiCall } = useAuth();
  const { withLoading } = useLoading();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'assigned' | 'all'>('assigned');
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  // Fetch all permissions
  const { data: allPermissions = [], error: permissionsError, isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      try {
        const response = await apiCall('/api/permissions');
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch permissions: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        // Check if the response has a data property or is directly an array
        return Array.isArray(data) ? data : (data.data || []);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        throw error;
      }
    },
    retry: 1,
  });

  // Fetch role permissions
  const { data: rolePermissions = [], error: rolePermissionsError, refetch: refetchRolePermissions } = useQuery<Permission[]>({
    queryKey: ['role-permissions', role.id],
    queryFn: async () => {
      try {
        const response = await apiCall(`/api/roles/${role.id}/permissions`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch role permissions: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        // Check if the response has a data property or is directly an array
        return Array.isArray(data) ? data : (data.data || []);
      } catch (error) {
        console.error('Error fetching role permissions:', error);
        throw error;
      }
    },
    retry: 1,
  });

  // Assign permissions mutation
  const assignPermissionsMutation = useMutation({
    mutationFn: async (permissionIds: string[]) => {
      const response = await apiCall(`/api/roles/${role.id}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ permissionIds }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to assign permissions: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : (data.data || data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Permissions updated successfully');
      refetchRolePermissions();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    },
  });

  // Add single permission
  const addPermission = async (permissionId: string) => {
    const currentPermissionIds = rolePermissions.map(p => p.id);
    const newPermissionIds = [...currentPermissionIds, permissionId];
    
    await withLoading(async () => {
      await assignPermissionsMutation.mutateAsync(newPermissionIds);
    });
  };

  // Remove single permission
  const removePermission = async (permissionId: string) => {
    const newPermissionIds = rolePermissions
      .map(p => p.id)
      .filter(id => id !== permissionId);
    
    await withLoading(async () => {
      await assignPermissionsMutation.mutateAsync(newPermissionIds);
    });
  };

  // Bulk operations
  const addAllPermissions = async () => {
    await withLoading(async () => {
      await assignPermissionsMutation.mutateAsync(allPermissions.map(p => p.id));
    });
  };

  const removeAllPermissions = async () => {
    await withLoading(async () => {
      await assignPermissionsMutation.mutateAsync([]);
    });
  };

  const addResourcePermissions = async (resource: string) => {
    const resourcePermissions = allPermissions.filter(p => p.resource === resource);
    const currentPermissionIds = rolePermissions.map(p => p.id);
    const newPermissionIds = [...new Set([...currentPermissionIds, ...resourcePermissions.map(p => p.id)])];
    
    await withLoading(async () => {
      await assignPermissionsMutation.mutateAsync(newPermissionIds);
    });
  };

  const removeResourcePermissions = async (resource: string) => {
    const newPermissionIds = rolePermissions
      .map(p => p.id)
      .filter(id => {
        const permission = allPermissions.find(p => p.id === id);
        return permission && permission.resource !== resource;
      });
    
    await withLoading(async () => {
      await assignPermissionsMutation.mutateAsync(newPermissionIds);
    });
  };

  // Filter permissions based on search and filters
  const filteredPermissions = allPermissions.filter(permission => {
    const matchesSearch = permission.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesResource = selectedResource === 'all' || permission.resource === selectedResource;
    const matchesAction = selectedAction === 'all' || permission.action === selectedAction;
    
    return matchesSearch && matchesResource && matchesAction;
  });

  // Group permissions by resource
  const groupedPermissions = filteredPermissions.reduce((groups, permission) => {
    const group = permission.resource;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  // Get unique resources and actions for filters
  const uniqueResources = Array.from(new Set(allPermissions.map(p => p.resource))).sort();
  const uniqueActions = Array.from(new Set(allPermissions.map(p => p.action))).sort();

  const isAssigned = (permissionId: string) => rolePermissions.some(p => p.id === permissionId);

  // Toggle resource expansion
  const toggleResourceExpansion = (resource: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource);
    } else {
      newExpanded.add(resource);
    }
    setExpandedResources(newExpanded);
  };

  // Expand all resources
  const expandAllResources = () => {
    const allResources = Object.keys(groupedPermissions);
    setExpandedResources(new Set(allResources));
  };

  // Collapse all resources
  const collapseAllResources = () => {
    setExpandedResources(new Set());
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-6xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Permissions for {role.displayName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {role.description || 'No description provided'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Role Info */}
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {role.level.replace('_', ' ')}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {role.isActive ? 'Active' : 'Inactive'}
          </span>
          {role.isSystem && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              System Role
            </span>
          )}
        </div>

        {/* Selected Permissions Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Selected Permissions</span>
            </div>
            <span className="text-sm text-blue-700 font-semibold">
              {rolePermissions.length} permissions assigned
            </span>
          </div>
          <div className="mt-2 text-xs text-blue-700">
            {Object.keys(groupedPermissions).length} resource categories available
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Resources</option>
              {uniqueResources.map(resource => (
                <option key={resource} value={resource}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('assigned')}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'assigned'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Assigned ({rolePermissions.length})
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({allPermissions.length})
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="mt-4 flex flex-wrap items-center space-x-2">
          <button
            onClick={addAllPermissions}
            disabled={assignPermissionsMutation.isPending}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
          >
            <Plus className="inline h-3 w-3 mr-1" />
            Add All
          </button>
          <button
            onClick={removeAllPermissions}
            disabled={assignPermissionsMutation.isPending}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
          >
            <Minus className="inline h-3 w-3 mr-1" />
            Remove All
          </button>
          <div className="border-l border-gray-300 mx-2 h-4"></div>
          <button
            onClick={expandAllResources}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            <ChevronDown className="inline h-3 w-3 mr-1" />
            Expand All
          </button>
          <button
            onClick={collapseAllResources}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            <ChevronRight className="inline h-3 w-3 mr-1" />
            Collapse All
          </button>
        </div>
      </div>

      {/* Error Display */}
      {(permissionsError || rolePermissionsError) && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <X className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800 font-medium">Error loading permissions</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            {permissionsError?.message || rolePermissionsError?.message}
          </p>
        </div>
      )}

      {/* Loading State */}
      {permissionsLoading && (
        <div className="px-6 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading permissions...</p>
        </div>
      )}

      {/* Permissions List */}
      <div className="max-h-96 overflow-y-auto">
        {allPermissions.length === 0 && !permissionsLoading && !permissionsError && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-600">No permissions found</p>
          </div>
        )}
        
        {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => {
          const assignedCount = resourcePermissions.filter(p => isAssigned(p.id)).length;
          const totalCount = resourcePermissions.length;
          const isExpanded = expandedResources.has(resource);
          
          return (
            <div key={resource} className="border-b border-gray-200 last:border-b-0">
              {/* Resource Header */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleResourceExpansion(resource)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    {React.createElement(RESOURCE_ICONS[resource as keyof typeof RESOURCE_ICONS] || Settings, {
                      className: "h-4 w-4 text-gray-500"
                    })}
                    <h3 className="text-sm font-medium text-gray-900 capitalize">
                      {resource} ({assignedCount}/{totalCount})
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addResourcePermissions(resource)}
                      disabled={assignPermissionsMutation.isPending}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                    >
                      Add All
                    </button>
                    <button
                      onClick={() => removeResourcePermissions(resource)}
                      disabled={assignPermissionsMutation.isPending}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      Remove All
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions List - Only show when expanded */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {resourcePermissions.map(permission => {
                    const assigned = isAssigned(permission.id);
                    const shouldShow = viewMode === 'all' || assigned;
                    
                    if (!shouldShow) return null;
                    
                    return (
                      <div
                        key={permission.id}
                        className={`px-6 py-4 transition-colors ${
                          assigned
                            ? 'bg-green-50 border-l-4 border-l-green-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-gray-900 leading-tight">
                                {permission.displayName}
                              </h5>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                                ACTION_COLORS[permission.action as keyof typeof ACTION_COLORS] || 'bg-gray-100 text-gray-800'
                              }`}>
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
                          
                          <button
                            onClick={() => assigned ? removePermission(permission.id) : addPermission(permission.id)}
                            disabled={assignPermissionsMutation.isPending}
                            className={`ml-3 p-2 rounded-md transition-colors ${
                              assigned
                                ? 'text-red-600 hover:bg-red-100'
                                : 'text-green-600 hover:bg-green-100'
                            } disabled:opacity-50`}
                          >
                            {assigned ? (
                              <Minus className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {viewMode === 'assigned' ? (
              <span>Showing {rolePermissions.length} assigned permissions</span>
            ) : (
              <span>Showing {filteredPermissions.length} of {allPermissions.length} total permissions</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 