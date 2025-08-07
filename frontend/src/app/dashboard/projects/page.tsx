'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/lib/permissions';
import { ProjectForm } from '@/components/forms/project-form';
import { ProjectViewModal } from '@/components/forms/project-view-modal';
import { ProjectsPageGuard } from '@/components/auth/page-permission-guard';
import { SmartActionButton } from '@/components/auth/smart-action-button';
import { Button, Input, Card, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '@/components/ui';
import { 
  ProjectsPermissionGuard, 
  ProjectsCreatePermissionGuard, 
  ProjectsUpdatePermissionGuard, 
  ProjectsDeletePermissionGuard,
  ProjectsExportPermissionGuard,
  ProjectsBulkActionsPermissionGuard
} from '@/components/auth/permission-guard';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  FolderOpen,
  Mail,
  Calendar,
  DollarSign,
  Eye,
  Download,
  Settings,
  AlertTriangle,
  Users,
  Building,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
  description?: string;
  code: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency: string;
  clientName?: string;
  ownerId: string;
  organizationId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  teams: Array<{
    id: string;
    team: {
      id: string;
      name: string;
      description?: string;
      leader: {
        id: string;
        displayName: string;
      };
    };
  }>;
}

export default function ProjectsPage() {
  return (
    <ProjectsPageGuard>
      <ProjectsPageContent />
    </ProjectsPageGuard>
  );
}

function ProjectsPageContent() {
  const { apiCall } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch projects
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiCall('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      return data || [];
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await apiCall(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      // Try to parse JSON response, but don't fail if it's not JSON
      try {
        return await response.json();
      } catch {
        // If response is not JSON, return success
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });

  // Bulk delete projects mutation
  const bulkDeleteProjectsMutation = useMutation({
    mutationFn: async (projectIds: string[]) => {
      // Note: This would need a bulk delete endpoint in the backend
      const promises = projectIds.map(async (projectId) => {
        const response = await apiCall(`/api/projects/${projectId}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to delete project ${projectId}: ${errorData.message || response.statusText}`);
        }
        // Try to parse JSON response, but don't fail if it's not JSON
        try {
          return await response.json();
        } catch {
          // If response is not JSON, return success
          return { success: true };
        }
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`${selectedProjects.length} projects deleted successfully`);
      setSelectedProjects([]);
      setShowBulkActions(false);
    },
    onError: (error) => {
      console.error('Error deleting projects:', error);
      toast.error(`Failed to delete some projects: ${error.message}`);
    },
  });

  // Filter projects based on search and filters
  const filteredProjects = (projects || []).filter((project: Project) => {
    const matchesSearch = (project.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (project.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (project.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (project.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-blue-100 text-blue-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Calendar className="h-4 w-4" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-4 w-4" />;
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />;
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.length === 0) {
      toast.error('No projects selected for deletion');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedProjects.length} projects?`)) {
      bulkDeleteProjectsMutation.mutate(selectedProjects);
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedProject(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedProject(null);
  };

  const handleExportProjects = () => {
    // Enhanced export functionality with permission check
    if (!hasPermission('projects', 'read')) {
      toast.error('You do not have permission to export projects');
      return;
    }
    
    // Implement export functionality
    const csvContent = generateCSV(filteredProjects);
    downloadCSV(csvContent, 'projects-export.csv');
    toast.success('Projects exported successfully');
  };

  const generateCSV = (projects: Project[]) => {
    const headers = ['Name', 'Code', 'Client', 'Status', 'Priority', 'Start Date', 'End Date', 'Budget', 'Owner', 'Teams', 'Created'];
    const rows = projects.map(project => [
      project.name,
      project.code,
      project.clientName || '',
      project.status.replace('_', ' '),
      project.priority,
      project.startDate ? new Date(project.startDate).toLocaleDateString() : '',
      project.endDate ? new Date(project.endDate).toLocaleDateString() : '',
      project.budget ? `${project.currency} ${project.budget.toLocaleString()}` : '',
      project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : '',
      project.teams ? project.teams.map(t => t.team.name).join('; ') : '',
      new Date(project.createdAt).toLocaleDateString()
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

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(filteredProjects.map((project: Project) => project.id));
    } else {
      setSelectedProjects([]);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load projects</h3>
            <p className="text-gray-500 mb-4">There was an error loading the projects data.</p>
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
      <ProjectsPermissionGuard>
        <div className="space-y-6">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your projects and track their progress.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <ProjectsExportPermissionGuard>
                <Button onClick={handleExportProjects} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </ProjectsExportPermissionGuard>
              <ProjectsCreatePermissionGuard>
                <Button onClick={handleCreateProject} variant="primary">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </ProjectsCreatePermissionGuard>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProjects.length > 0 && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
                    </span>
                    <ProjectsBulkActionsPermissionGuard>
                      <Button
                        onClick={handleBulkDelete}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </ProjectsBulkActionsPermissionGuard>
                  </div>
                  <Button
                    onClick={() => setSelectedProjects([])}
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
                      placeholder="Search projects..."
                      className="pl-10"
                    />
                  </div>
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
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Table */}
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <input
                        type="checkbox"
                        checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project: Project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={(e) => handleProjectSelection(project.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {project.name}
                            </div>
                            {project.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-gray-600">{project.code}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{project.clientName || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getPriorityIcon(project.priority)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {project.startDate && (
                            <div>Start: {new Date(project.startDate).toLocaleDateString()}</div>
                          )}
                          {project.endDate && (
                            <div>End: {new Date(project.endDate).toLocaleDateString()}</div>
                          )}
                          {!project.startDate && !project.endDate && '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {project.budget ? `${project.currency} ${project.budget.toLocaleString()}` : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : '-'}
                          </span>
                        </div>
                      </TableCell>
                                             <TableCell>
                         <div className="flex items-center">
                           <Users className="h-4 w-4 text-gray-400 mr-2" />
                           <span className="text-sm text-gray-900">
                             {project.teams && project.teams.length > 0 ? `${project.teams.length} team${project.teams.length !== 1 ? 's' : ''}` : '-'}
                           </span>
                         </div>
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <SmartActionButton
                            resource="projects"
                            onEdit={() => handleEditProject(project)}
                            onView={() => handleViewProject(project)}
                            variant="ghost"
                            size="sm"
                          />
                          <ProjectsDeletePermissionGuard>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProject(project.id)}
                              title="Delete Project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ProjectsDeletePermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredProjects.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No projects found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project Form Modal */}
        <ProjectForm
          project={selectedProject}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />

        {/* Project View Modal */}
        <ProjectViewModal
          project={selectedProject}
          isOpen={isViewModalOpen}
          onClose={handleViewModalClose}
        />
      </ProjectsPermissionGuard>
    </DashboardLayout>
  );
} 