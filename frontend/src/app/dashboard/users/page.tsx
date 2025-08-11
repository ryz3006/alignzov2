'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/lib/permissions';
import { UserForm } from '@/components/forms/user-form';
import { UserViewModal } from '@/components/forms/user-view-modal';
import { UsersPageGuard } from '@/components/auth/page-permission-guard';
import { SmartActionButton } from '@/components/auth/smart-action-button';
import { Button, Input, Card, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '@/components/ui';
import { 
  UsersPermissionGuard, 
  UsersCreatePermissionGuard, 
  UsersUpdatePermissionGuard, 
  UsersDeletePermissionGuard,
  UsersAssignRolePermissionGuard,
  UsersChangeRolePermissionGuard,
  UsersExportPermissionGuard,
  UsersBulkActionsPermissionGuard
} from '@/components/auth/permission-guard';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Shield,
  Eye,
  Download,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  title?: string;
  department?: string;
  phone?: string;
  managerId?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userRoles?: Array<{
    role: {
      id: string;
      name: string;
      displayName: string;
      level: string;
    };
  }>;
  teamMembers: Array<{
    id: string;
    team: {
      id: string;
      name: string;
    };
    role: string;
  }>;
  projectMembers: Array<{
    id: string;
    project: {
      id: string;
      name: string;
      code: string;
    };
    role: string;
    reportingToId?: string;
    reportingTo?: {
      id: string;
      displayName: string;
    };
  }>;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  level: string;
}

const mockRoles: Role[] = [
  { id: '1', name: 'SUPER_ADMIN', displayName: 'Super Administrator', level: 'FULL_ACCESS' },
  { id: '2', name: 'ADMIN', displayName: 'Administrator', level: 'FULL_ACCESS' },
  { id: '3', name: 'MANAGER', displayName: 'Manager', level: 'TEAM' },
  { id: '4', name: 'EMPLOYEE', displayName: 'Employee', level: 'INDIVIDUAL' },
];

export default function UsersPage() {
  return (
    <UsersPageGuard>
      <UsersPageContent />
    </UsersPageGuard>
  );
}

function UsersPageContent() {
  const { apiCall } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiCall('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      return data.users || [];
    },
  });

  // Fetch roles
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiCall('/api/roles');
      if (!response.ok) return [] as Role[];
      const data = await response.json();
      return Array.isArray(data) ? (data as Role[]) : [];
    },
    enabled: isRoleModalOpen && hasPermission('roles', 'read'),
    retry: false,
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiCall(`/api/users/${userId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    },
  });

  // Bulk delete users mutation
  const bulkDeleteUsersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      // Note: This would need a bulk delete endpoint in the backend
      const promises = userIds.map(userId => 
        apiCall(`/api/users/${userId}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`${selectedUsers.length} users deleted successfully`);
      setSelectedUsers([]);
      setShowBulkActions(false);
    },
    onError: (error) => {
      console.error('Error deleting users:', error);
      toast.error('Failed to delete some users');
    },
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      await apiCall(`/api/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role assigned successfully');
      setIsRoleModalOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    },
  });

  // Filter users based on search and filters
  const filteredUsers = Array.isArray(users) ? users.filter((user: User) => {
    const matchesSearch = (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
                       user.userRoles?.some(ur => ur.role.name === roleFilter);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) : [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <Shield className="h-4 w-4" />;
      case 'ADMIN': return <Shield className="h-4 w-4" />;
      case 'MANAGER': return <UserPlus className="h-4 w-4" />;
      case 'EMPLOYEE': return <UserPlus className="h-4 w-4" />;
      default: return <UserPlus className="h-4 w-4" />;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected for deletion');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      bulkDeleteUsersMutation.mutate(selectedUsers);
    }
  };

  const handleAssignRole = (user: User) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  const handleRoleAssignment = (roleId: string) => {
    if (selectedUser) {
      assignRoleMutation.mutate({ userId: selectedUser.id, roleId });
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedUser(null);
  };

  const handleExportUsers = () => {
    // Enhanced export functionality with permission check
    if (!hasPermission('users', 'read')) {
      toast.error('You do not have permission to export users');
      return;
    }
    
    // Implement export functionality
    const csvContent = generateCSV(filteredUsers);
    downloadCSV(csvContent, 'users-export.csv');
    toast.success('Users exported successfully');
  };

  const generateCSV = (users: User[]) => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Department', 'Title', 'Created'];
    const rows = users.map(user => [
      `${user.firstName} ${user.lastName}`,
      user.email,
      user.userRoles?.[0]?.role.displayName || 'No role',
      user.isActive ? 'Active' : 'Inactive',
      user.department || '',
      user.title || '',
      new Date(user.createdAt).toLocaleDateString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((user: User) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load users</h3>
            <p className="text-gray-500 mb-4">There was an error loading the users data.</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <UsersPermissionGuard>
        <div className="space-y-6">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your team members and their permissions.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <UsersExportPermissionGuard>
                <Button onClick={handleExportUsers} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </UsersExportPermissionGuard>
              <UsersCreatePermissionGuard>
                <Button onClick={handleCreateUser} variant="primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </UsersCreatePermissionGuard>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                    </span>
                    <UsersBulkActionsPermissionGuard>
                      <Button
                        onClick={handleBulkDelete}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </UsersBulkActionsPermissionGuard>
                  </div>
                  <Button
                    onClick={() => setSelectedUsers([])}
                    variant="ghost"
                    size="sm"
                  >
                    Clear Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Search */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.userRoles && user.userRoles.length > 0 ? (
                          <div className="flex items-center">
                            {getRoleIcon(user.userRoles[0].role.name)}
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.userRoles[0].role.name)}`}>
                              {user.userRoles[0].role.displayName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No role assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <SmartActionButton
                            resource="users"
                            onEdit={() => handleEditUser(user)}
                            onView={() => handleViewUser(user)}
                            variant="ghost"
                            size="sm"
                          />
                          <UsersAssignRolePermissionGuard>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssignRole(user)}
                              title="Assign Role"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          </UsersAssignRolePermissionGuard>
                          <UsersDeletePermissionGuard>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </UsersDeletePermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredUsers.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Form Modal */}
        <UserForm
          user={selectedUser ?? undefined}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
          readOnly={!hasPermission('users', 'update')}
        />

        {/* User View Modal */}
        <UserViewModal
          user={selectedUser}
          isOpen={isViewModalOpen}
          onClose={handleViewModalClose}
        />

        {/* Role Assignment Modal */}
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          title="Assign Role"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Assign a role to {selectedUser?.firstName} {selectedUser?.lastName}
            </p>
            <div className="space-y-2">
              {roles.map((role: Role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleAssignment(role.id)}
                  className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{role.displayName}</div>
                      <div className="text-sm text-gray-500">{role.level}</div>
                    </div>
                    {selectedUser?.userRoles?.some(ur => ur.role.id === role.id) && (
                      <span className="text-indigo-600 text-sm font-medium">Current</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      </UsersPermissionGuard>
    </DashboardLayout>
  );
} 