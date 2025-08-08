'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Modal } from '@/components/ui/modal';
import { RoleForm } from '@/components/forms/role-form';
import { RolesPageGuard } from '@/components/auth/page-permission-guard';
import { 
  RolesPermissionGuard, 
  RolesCreatePermissionGuard, 
  RolesUpdatePermissionGuard, 
  RolesDeletePermissionGuard,
  AdminRoleGuard
} from '@/components/auth/permission-guard';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Users,
  Settings,
  Eye,
  
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: 'FULL_ACCESS' | 'PROJECT' | 'TEAM' | 'INDIVIDUAL';
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export default function RolesPage() {
  return (
    <RolesPageGuard>
      <RolesPageContent />
    </RolesPageGuard>
  );
}

function RolesPageContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      console.log('RolesPage: Making API call to fetch roles');
      const response = await apiCall('/api/roles?includePermissions=true');
      console.log('RolesPage: API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('RolesPage: API call failed:', response.status, errorText);
        throw new Error(`Failed to fetch roles: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('RolesPage: API call successful, received data:', data);
      return data;
    },
    retry: false,
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await apiCall(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete role');
    },
  });

  const filteredRoles = (roles || []).filter((role: Role) => {
    const matchesSearch = 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = levelFilter === 'all' || role.level === levelFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && role.isActive) ||
      (statusFilter === 'inactive' && !role.isActive);

    return matchesSearch && matchesLevel && matchesStatus;
  });



  const getLevelColor = (level: string) => {
    switch (level) {
      case 'FULL_ACCESS':
        return 'bg-red-100 text-red-800';
      case 'PROJECT':
        return 'bg-purple-100 text-purple-800';
      case 'TEAM':
        return 'bg-blue-100 text-blue-800';
      case 'INDIVIDUAL':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'FULL_ACCESS':
        return <Shield className="h-4 w-4" />;
      case 'PROJECT':
        return <Settings className="h-4 w-4" />;
      case 'TEAM':
        return <Users className="h-4 w-4" />;
      case 'INDIVIDUAL':
        return <Eye className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const handleCreateRole = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingRole(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
  };

  

  return (
    <DashboardLayout>
      <AdminRoleGuard>
        <div className="space-y-6">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage system roles and their permissions.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <RolesCreatePermissionGuard>
                <button 
                  onClick={handleCreateRole}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </button>
              </RolesCreatePermissionGuard>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  Search
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search roles..."
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Level Filter */}
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                  Access Level
                </label>
                <select
                  id="level"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Levels</option>
                  <option value="FULL_ACCESS">Full Access</option>
                  <option value="PROJECT">Project</option>
                  <option value="TEAM">Team</option>
                  <option value="INDIVIDUAL">Individual</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

                     {/* Loading State */}
           {isLoading && (
             <div className="bg-white shadow rounded-lg p-6">
               <div className="flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                 <span className="ml-3 text-gray-600">Loading roles...</span>
               </div>
             </div>
           )}

           {/* Error State */}
           {error && (
             <div className="bg-red-50 border border-red-200 rounded-lg p-6">
               <div className="flex items-center">
                 <div className="flex-shrink-0">
                   <Shield className="h-5 w-5 text-red-400" />
                 </div>
                 <div className="ml-3">
                   <h3 className="text-sm font-medium text-red-800">
                     Failed to load roles
                   </h3>
                   <div className="mt-2 text-sm text-red-700">
                     <p>{error.message}</p>
                   </div>
                   <div className="mt-4">
                     <button
                       onClick={() => window.location.reload()}
                       className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                     >
                       Try Again
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           )}

           

           {/* Roles Table */}
           {!isLoading && !error && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Access Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Permissions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRoles.map((role: Role) => (
                        <tr key={role.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {role.displayName}
                              </div>
                              <div className="text-sm text-gray-500">{role.name}</div>
                              {role.description && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {role.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getLevelIcon(role.level)}
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(role.level)}`}>
                                {role.level.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {role.rolePermissions ? role.rolePermissions.length : 0} permissions
                            </div>
                            {role.rolePermissions && role.rolePermissions.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {role.rolePermissions.slice(0, 3).map(rp => rp.permission.displayName).join(', ')}
                                {role.rolePermissions.length > 3 && ` +${role.rolePermissions.length - 3} more`}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              role.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {role.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              role.isSystem 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {role.isSystem ? 'System' : 'Custom'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              
                              <RolesUpdatePermissionGuard>
                                <button 
                                  onClick={() => handleEditRole(role)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit Role"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </RolesUpdatePermissionGuard>
                              {!role.isSystem && (
                                <RolesDeletePermissionGuard>
                                  <button 
                                    onClick={() => handleDeleteRole(role.id, role.displayName)}
                                    className="text-red-600 hover:text-red-900"
                                    disabled={deleteRoleMutation.isPending}
                                    title="Delete Role"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </RolesDeletePermissionGuard>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredRoles.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">
                      <Shield className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || levelFilter !== 'all' || statusFilter !== 'all'
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Get started by creating a new role.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </AdminRoleGuard>

      {/* Create Role Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        title="Create New Role"
        size="lg"
      >
        <RoleForm
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editingRole}
        onClose={handleModalClose}
        title="Edit Role"
        size="lg"
      >
        {editingRole && (
          <RoleForm
            role={editingRole}
            onSuccess={handleFormSuccess}
            onCancel={handleModalClose}
          />
        )}
      </Modal>

      
    </DashboardLayout>
  );
} 