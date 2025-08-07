'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/lib/permissions';
import { WorkLogsPageGuard } from '@/components/auth/page-permission-guard';
import { SmartActionButton } from '@/components/auth/smart-action-button';
import { 
  WorkLogsPermissionGuard,
  WorkLogsCreatePermissionGuard,
  WorkLogsUpdatePermissionGuard,
  WorkLogsDeletePermissionGuard,
  WorkLogsExportPermissionGuard,
  WorkLogsBulkActionsPermissionGuard
} from '@/components/auth/permission-guard';
import { Button, Input, Card, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '@/components/ui';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  FolderOpen,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WorkLog {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  createdAt: string;
  isBillable?: boolean;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  tags?: string[];
  // Enhanced fields for better work reporting and time tracking
  module?: string;
  taskCategory?: string;
  workCategory?: string;
  severityCategory?: string;
  sourceCategory?: string;
  ticketReference?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    code: string;
  };
}

interface WorkLogFormData {
  projectId: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  isBillable?: boolean;
  tags?: string[];
  // Enhanced fields for better work reporting and time tracking
  module?: string;
  taskCategory?: string;
  workCategory?: string;
  severityCategory?: string;
  sourceCategory?: string;
  ticketReference?: string;
}

const mockWorkLogs: WorkLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'John Doe',
    projectId: '1',
    projectName: 'Website Redesign',
    description: 'Working on homepage layout and responsive design',
    startTime: '2024-01-15T09:00:00Z',
    endTime: '2024-01-15T12:00:00Z',
    duration: 10800, // 3 hours
    createdAt: '2024-01-15T09:00:00Z',
    isBillable: true,
    isApproved: true,
  },
  {
    id: '2',
    userId: '2',
    userName: 'Jane Smith',
    projectId: '2',
    projectName: 'Mobile App Development',
    description: 'Setting up development environment and initial project structure',
    startTime: '2024-01-15T14:00:00Z',
    endTime: '2024-01-15T17:30:00Z',
    duration: 12600, // 3.5 hours
    createdAt: '2024-01-15T14:00:00Z',
    isBillable: true,
    isApproved: false,
  },
  {
    id: '3',
    userId: '3',
    userName: 'Mike Johnson',
    projectId: '3',
    projectName: 'Data Migration',
    description: 'Migrating user data from legacy system to new database',
    startTime: '2024-01-15T08:00:00Z',
    endTime: '2024-01-15T16:00:00Z',
    duration: 28800, // 8 hours
    createdAt: '2024-01-15T08:00:00Z',
    isBillable: false,
    isApproved: true,
  },
];

export default function WorkLogsPage() {
  return (
    <WorkLogsPageGuard>
      <WorkLogsPageContent />
    </WorkLogsPageGuard>
  );
}

function WorkLogsPageContent() {
  const { apiCall } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: ''
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [selectedWorkLogs, setSelectedWorkLogs] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workLogToDelete, setWorkLogToDelete] = useState<WorkLog | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Fetch work logs
  const { data: workLogsResponse, isLoading, error } = useQuery({
    queryKey: ['workLogs'],
    queryFn: async () => {
      try {
        const response = await apiCall('/api/work-logs');
        if (!response.ok) {
          throw new Error('Failed to fetch work logs');
        }
        const data = await response.json();
        return data || { data: [] };
      } catch (error) {
        console.error('Error fetching work logs:', error);
        return { data: [] };
      }
    },
    retry: false,
  });

  // Fetch projects for form
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const response = await apiCall('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
      }
    },
  });

  // Transform API data to match frontend interface
  const transformWorkLog = (log: any): WorkLog => {
    const userName = log.userName || (log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() : 'Unknown User');
    const projectName = log.projectName || (log.project ? log.project.name : 'Unknown Project');
    
    return {
      id: log.id,
      userId: log.userId,
      userName,
      projectId: log.projectId,
      projectName,
      description: log.description || '',
      startTime: log.startTime,
      endTime: log.endTime,
      duration: log.duration || 0,
      createdAt: log.createdAt,
      isBillable: log.isBillable,
      isApproved: log.isApproved,
      approvedBy: log.approvedBy,
      approvedAt: log.approvedAt,
      tags: log.tags,
      // Enhanced fields for better work reporting and time tracking
      module: log.module,
      taskCategory: log.taskCategory,
      workCategory: log.workCategory,
      severityCategory: log.severityCategory,
      sourceCategory: log.sourceCategory,
      ticketReference: log.ticketReference,
      user: log.user,
      project: log.project,
    };
  };

  const workLogs = (workLogsResponse?.data || mockWorkLogs).map(transformWorkLog);

  // Create work log mutation
  const createWorkLogMutation = useMutation({
    mutationFn: async (workLogData: WorkLogFormData) => {
      const response = await apiCall('/api/work-logs', {
        method: 'POST',
        body: JSON.stringify(workLogData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create work log: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      toast.success('Work log created successfully');
      setIsFormOpen(false);
      setSelectedWorkLog(null);
    },
    onError: (error) => {
      toast.error(`Failed to create work log: ${error.message}`);
    },
  });

  // Update work log mutation
  const updateWorkLogMutation = useMutation({
    mutationFn: async ({ id, workLogData }: { id: string; workLogData: Partial<WorkLogFormData> }) => {
      const response = await apiCall(`/api/work-logs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(workLogData),
      });
      if (!response.ok) {
        throw new Error('Failed to update work log');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      toast.success('Work log updated successfully');
      setIsFormOpen(false);
      setSelectedWorkLog(null);
    },
    onError: (error) => {
      console.error('Error updating work log:', error);
      toast.error('Failed to update work log');
    },
  });

  // Delete work log mutation
  const deleteWorkLogMutation = useMutation({
    mutationFn: async (workLogId: string) => {
      const response = await apiCall(`/api/work-logs/${workLogId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete work log');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      toast.success('Work log deleted successfully');
      setDeleteConfirmOpen(false);
      setWorkLogToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting work log:', error);
      toast.error('Failed to delete work log');
    },
  });

  // Bulk delete work logs mutation
  const bulkDeleteWorkLogsMutation = useMutation({
    mutationFn: async (workLogIds: string[]) => {
      const promises = workLogIds.map(workLogId => 
        apiCall(`/api/work-logs/${workLogId}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      toast.success(`${selectedWorkLogs.length} work logs deleted successfully`);
      setSelectedWorkLogs([]);
      setBulkDeleteConfirmOpen(false);
    },
    onError: (error) => {
      console.error('Error deleting work logs:', error);
      toast.error('Failed to delete some work logs');
    },
  });

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  // Filter work logs based on search and filters
  const filteredWorkLogs = workLogs.filter((log: WorkLog) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (log.userName?.toLowerCase() || '').includes(searchLower) ||
      (log.projectName?.toLowerCase() || '').includes(searchLower) ||
      (log.description?.toLowerCase() || '').includes(searchLower);
    
    const matchesUser = userFilter === 'all' || log.userName === userFilter;
    const matchesProject = projectFilter === 'all' || log.projectName === projectFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'approved') {
      matchesStatus = log.isApproved === true;
    } else if (statusFilter === 'pending') {
      matchesStatus = log.isApproved === false;
    } else if (statusFilter === 'billable') {
      matchesStatus = log.isBillable === true;
    } else if (statusFilter === 'non-billable') {
      matchesStatus = log.isBillable === false;
    }
    
    // Date filtering logic
    let matchesDate = true;
    const logDate = new Date(log.startTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === 'today') {
      const logDateOnly = new Date(logDate);
      logDateOnly.setHours(0, 0, 0, 0);
      matchesDate = logDateOnly.getTime() === today.getTime();
    } else if (dateFilter === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      matchesDate = logDate >= startOfWeek && logDate <= endOfWeek;
    } else if (dateFilter === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      matchesDate = logDate >= startOfMonth && logDate <= endOfMonth;
    } else if (dateFilter === 'custom') {
      if (customDateRange.startDate && customDateRange.endDate) {
        const startDate = new Date(customDateRange.startDate);
        const endDate = new Date(customDateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = logDate >= startDate && logDate <= endDate;
      }
    }
    
    return matchesSearch && matchesUser && matchesProject && matchesStatus && matchesDate;
  });

  // Get unique users and projects for filters
  const uniqueUsers: string[] = [...new Set(workLogs.map((log: WorkLog) => log.userName).filter(Boolean))] as string[];
  const uniqueProjects: string[] = [...new Set(workLogs.map((log: WorkLog) => log.projectName).filter(Boolean))] as string[];

  const handleCreateWorkLog = () => {
    setSelectedWorkLog(null);
    setIsFormOpen(true);
  };

  const handleEditWorkLog = (workLog: WorkLog) => {
    setSelectedWorkLog(workLog);
    setIsFormOpen(true);
  };

  const handleViewWorkLog = (workLog: WorkLog) => {
    setSelectedWorkLog(workLog);
    setIsViewModalOpen(true);
  };

  const handleDeleteWorkLog = (workLog: WorkLog) => {
    setWorkLogToDelete(workLog);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (workLogToDelete) {
      deleteWorkLogMutation.mutate(workLogToDelete.id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedWorkLogs.length === 0) {
      toast.error('No work logs selected for deletion');
      return;
    }
    setBulkDeleteConfirmOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    bulkDeleteWorkLogsMutation.mutate(selectedWorkLogs);
  };

  const handleWorkLogSelection = (workLogId: string, checked: boolean) => {
    if (checked) {
      setSelectedWorkLogs(prev => [...prev, workLogId]);
    } else {
      setSelectedWorkLogs(prev => prev.filter(id => id !== workLogId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWorkLogs(filteredWorkLogs.map((workLog: WorkLog) => workLog.id));
    } else {
      setSelectedWorkLogs([]);
    }
  };

  const handleExportWorkLogs = () => {
    if (!hasPermission('work_logs', 'read')) {
      toast.error('You do not have permission to export work logs');
      return;
    }
    
    const csvContent = generateCSV(filteredWorkLogs);
    downloadCSV(csvContent, 'work-logs-export.csv');
    toast.success('Work logs exported successfully');
  };

  const generateCSV = (workLogs: WorkLog[]) => {
    const headers = ['User', 'Project', 'Description', 'Date', 'Start Time', 'End Time', 'Duration', 'Billable', 'Approved'];
    const rows = workLogs.map((log: WorkLog) => [
      log.userName,
      log.projectName,
      log.description,
      formatDate(log.startTime),
      formatTime(log.startTime),
      formatTime(log.endTime),
      formatDuration(log.duration),
      log.isBillable ? 'Yes' : 'No',
      log.isApproved ? 'Yes' : 'No'
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

  const handleFormSubmit = (formData: WorkLogFormData) => {
    if (selectedWorkLog) {
      updateWorkLogMutation.mutate({ id: selectedWorkLog.id, workLogData: formData });
    } else {
      createWorkLogMutation.mutate(formData);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedWorkLog(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedWorkLog(null);
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    // Clear custom date range when switching away from custom mode
    if (value !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setCustomDateRange(prev => ({ ...prev, [field]: value }));
    
    // Validate that end date is not before start date
    if (field === 'startDate' && customDateRange.endDate && value > customDateRange.endDate) {
      setCustomDateRange(prev => ({ ...prev, endDate: value }));
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setUserFilter('all');
    setProjectFilter('all');
    setDateFilter('all');
    setCustomDateRange({ startDate: '', endDate: '' });
    setStatusFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || 
    userFilter !== 'all' || 
    projectFilter !== 'all' || 
    dateFilter !== 'all' || 
    statusFilter !== 'all';

  // Get filter summary text
  const getFilterSummary = () => {
    const filters = [];
    if (searchTerm) filters.push(`Search: "${searchTerm}"`);
    if (userFilter !== 'all') filters.push(`User: ${userFilter}`);
    if (projectFilter !== 'all') filters.push(`Project: ${projectFilter}`);
    if (dateFilter !== 'all') {
      if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        filters.push(`Date: ${customDateRange.startDate} to ${customDateRange.endDate}`);
      } else {
        const dateLabels = {
          today: 'Today',
          week: 'This Week',
          month: 'This Month'
        };
        filters.push(`Date: ${dateLabels[dateFilter as keyof typeof dateLabels]}`);
      }
    }
    if (statusFilter !== 'all') {
      const statusLabels = {
        approved: 'Approved',
        pending: 'Pending',
        billable: 'Billable',
        'non-billable': 'Non-Billable'
      };
      filters.push(`Status: ${statusLabels[statusFilter as keyof typeof statusLabels]}`);
    }
    return filters.join(', ');
  };

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load work logs</h3>
            <p className="text-gray-500 mb-4">There was an error loading the work logs data.</p>
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
      <WorkLogsPermissionGuard>
        <div className="space-y-6">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Work Logs</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage time tracking logs across all users and projects.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <WorkLogsExportPermissionGuard>
                <Button onClick={handleExportWorkLogs} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </WorkLogsExportPermissionGuard>
              <WorkLogsCreatePermissionGuard>
                <Button onClick={handleCreateWorkLog} variant="primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Work Log
                </Button>
              </WorkLogsCreatePermissionGuard>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedWorkLogs.length > 0 && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedWorkLogs.length} work log{selectedWorkLogs.length !== 1 ? 's' : ''} selected
                    </span>
                    <WorkLogsBulkActionsPermissionGuard>
                      <Button
                        onClick={handleBulkDelete}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </WorkLogsBulkActionsPermissionGuard>
                  </div>
                  <Button
                    onClick={() => setSelectedWorkLogs([])}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                      placeholder="Search logs..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* User Filter */}
                <div>
                  <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <select
                    id="user"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Users</option>
                    {uniqueUsers.map((user) => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </select>
                </div>

                {/* Project Filter */}
                <div>
                  <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    id="project"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Projects</option>
                    {uniqueProjects.map((project) => (
                      <option key={project} value={project}>{project}</option>
                    ))}
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
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="billable">Billable</option>
                    <option value="non-billable">Non-Billable</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    id="date"
                    value={dateFilter}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Range Inputs */}
              {dateFilter === 'custom' && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      id="startDate"
                      value={customDateRange.startDate}
                      onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                      className="block w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <Input
                      type="date"
                      id="endDate"
                      value={customDateRange.endDate}
                      onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                      min={customDateRange.startDate}
                      className="block w-full"
                    />
                  </div>
                </div>
              )}
              
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Active Filters: {getFilterSummary()}
                    </span>
                  </div>
                  <span className="text-sm text-blue-700">
                    {filteredWorkLogs.length} of {workLogs.length} work logs
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Logs Table */}
          <Card>
            <CardContent>
              <Table>
                                 <TableHeader>
                   <TableRow>
                     <TableHead>
                       <input
                         type="checkbox"
                         checked={selectedWorkLogs.length === filteredWorkLogs.length && filteredWorkLogs.length > 0}
                         onChange={(e) => handleSelectAll(e.target.checked)}
                         className="rounded border-gray-300"
                       />
                     </TableHead>
                     <TableHead>User</TableHead>
                     <TableHead>Project</TableHead>
                     <TableHead>Duration</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {filteredWorkLogs.map((log: WorkLog) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedWorkLogs.includes(log.id)}
                          onChange={(e) => handleWorkLogSelection(log.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {log.userName || 'Unknown User'}
                          </span>
                        </div>
                      </TableCell>
                                             <TableCell>
                         <div className="flex items-center">
                           <FolderOpen className="h-4 w-4 text-gray-400 mr-2" />
                           <span className="text-sm text-gray-900">
                             {log.projectName || 'Unknown Project'}
                           </span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <span className="text-sm font-medium text-gray-900">
                           {formatDuration(log.duration)}
                         </span>
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {log.isBillable && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Billable
                            </span>
                          )}
                          {log.isApproved ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </span>
                          )}
                        </div>
                      </TableCell>
                                             <TableCell>
                         <div className="flex items-center space-x-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleViewWorkLog(log)}
                             title="View Work Log Details"
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                           <SmartActionButton
                             resource="work_logs"
                             onEdit={() => handleEditWorkLog(log)}
                             onView={() => handleViewWorkLog(log)}
                             variant="ghost"
                             size="sm"
                           />
                           <WorkLogsDeletePermissionGuard>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleDeleteWorkLog(log)}
                               title="Delete Work Log"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </WorkLogsDeletePermissionGuard>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredWorkLogs.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No work logs found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Work Log Form Modal */}
        <WorkLogFormModal
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          workLog={selectedWorkLog}
          projects={projects}
          isLoading={createWorkLogMutation.isPending || updateWorkLogMutation.isPending}
        />

        {/* Work Log View Modal */}
        <WorkLogViewModal
          workLog={selectedWorkLog}
          isOpen={isViewModalOpen}
          onClose={handleViewModalClose}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          title="Delete Work Log"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this work log? This action cannot be undone.
            </p>
            {workLogToDelete && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-900">
                  {workLogToDelete.userName} - {workLogToDelete.projectName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {workLogToDelete.description}
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleteWorkLogMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={deleteWorkLogMutation.isPending}
              >
                {deleteWorkLogMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Bulk Delete Confirmation Modal */}
        <Modal
          isOpen={bulkDeleteConfirmOpen}
          onClose={() => setBulkDeleteConfirmOpen(false)}
          title="Delete Multiple Work Logs"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete {selectedWorkLogs.length} work log{selectedWorkLogs.length !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setBulkDeleteConfirmOpen(false)}
                disabled={bulkDeleteWorkLogsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmBulkDelete}
                disabled={bulkDeleteWorkLogsMutation.isPending}
              >
                {bulkDeleteWorkLogsMutation.isPending ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </Modal>
      </WorkLogsPermissionGuard>
    </DashboardLayout>
  );
}

// Work Log Form Modal Component
interface WorkLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkLogFormData) => void;
  workLog: WorkLog | null;
  projects: any[];
  isLoading: boolean;
}

function WorkLogFormModal({ isOpen, onClose, onSubmit, workLog, projects, isLoading }: WorkLogFormModalProps) {
  const [formData, setFormData] = useState<WorkLogFormData>({
    projectId: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 0,
    isBillable: false,
    tags: [],
    module: '',
    taskCategory: '',
    workCategory: '',
    severityCategory: '',
    sourceCategory: '',
    ticketReference: '',
  });

  // Helper function to calculate duration in seconds from start and end times
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      return Math.floor((end.getTime() - start.getTime()) / 1000);
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 0;
    }
  };

  // Helper function to convert ISO date to datetime-local format
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Format as YYYY-MM-DDTHH:mm (datetime-local format)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };

  // Reset form when workLog changes
  useEffect(() => {
    if (workLog) {
      setFormData({
        projectId: workLog.projectId,
        description: workLog.description,
        startTime: formatDateForInput(workLog.startTime),
        endTime: formatDateForInput(workLog.endTime),
        duration: workLog.duration || 0,
        isBillable: workLog.isBillable || false,
        tags: workLog.tags || [],
        module: workLog.module,
        taskCategory: workLog.taskCategory,
        workCategory: workLog.workCategory,
        severityCategory: workLog.severityCategory,
        sourceCategory: workLog.sourceCategory,
        ticketReference: workLog.ticketReference,
      });
    } else {
      setFormData({
        projectId: '',
        description: '',
        startTime: '',
        endTime: '',
        duration: 0,
        isBillable: false,
        tags: [],
        module: '',
        taskCategory: '',
        workCategory: '',
        severityCategory: '',
        sourceCategory: '',
        ticketReference: '',
      });
    }
  }, [workLog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Calculate duration before submitting
    const duration = calculateDuration(formData.startTime, formData.endTime);
    
    // Convert datetime-local format to ISO string for backend
    const startTimeISO = formData.startTime ? new Date(formData.startTime).toISOString() : '';
    const endTimeISO = formData.endTime ? new Date(formData.endTime).toISOString() : '';
    
    const submissionData = {
      ...formData,
      startTime: startTimeISO,
      endTime: endTimeISO,
      duration,
    };
    onSubmit(submissionData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={workLog ? 'Edit Work Log' : 'Add Work Log'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <select
              id="projectId"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="isBillable" className="block text-sm font-medium text-gray-700 mb-1">
              Billable
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isBillable"
                checked={formData.isBillable}
                onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="isBillable" className="ml-2 text-sm text-gray-700">
                Mark as billable
              </label>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Describe the work performed..."
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="datetime-local"
              id="startTime"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="datetime-local"
              id="endTime"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>

        {/* Enhanced Work Details Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Work Details</h3>
          
          {/* Ticket Reference */}
          <div className="mb-4">
            <label htmlFor="ticketReference" className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Reference ID / Email Subject
            </label>
            <input
              type="text"
              id="ticketReference"
              value={formData.ticketReference || ''}
              onChange={(e) => setFormData({ ...formData, ticketReference: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter ticket reference ID or email subject..."
            />
          </div>

          {/* Category Fields - Only show if project has configured categories */}
          {(() => {
            const selectedProject = projects.find(p => p.id === formData.projectId);
            if (!selectedProject) return null;

            const hasModules = selectedProject.modules && selectedProject.modules.length > 0;
            const hasTaskCategories = selectedProject.taskCategories && selectedProject.taskCategories.length > 0;
            const hasWorkCategories = selectedProject.workCategories && selectedProject.workCategories.length > 0;
            const hasSeverityCategories = selectedProject.severityCategories && selectedProject.severityCategories.length > 0;
            const hasSourceCategories = selectedProject.sourceCategories && selectedProject.sourceCategories.length > 0;

            if (!hasModules && !hasTaskCategories && !hasWorkCategories && !hasSeverityCategories && !hasSourceCategories) {
              return null;
            }

            return (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {hasModules && (
                  <div>
                    <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-1">
                      Module *
                    </label>
                    <select
                      id="module"
                      value={formData.module || ''}
                      onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a module</option>
                      {selectedProject.modules.map((module: string) => (
                        <option key={module} value={module}>
                          {module}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {hasTaskCategories && (
                  <div>
                    <label htmlFor="taskCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      Task Category *
                    </label>
                    <select
                      id="taskCategory"
                      value={formData.taskCategory || ''}
                      onChange={(e) => setFormData({ ...formData, taskCategory: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a task category</option>
                      {selectedProject.taskCategories.map((category: string) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {hasWorkCategories && (
                  <div>
                    <label htmlFor="workCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Category *
                    </label>
                    <select
                      id="workCategory"
                      value={formData.workCategory || ''}
                      onChange={(e) => setFormData({ ...formData, workCategory: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a work category</option>
                      {selectedProject.workCategories.map((category: string) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {hasSeverityCategories && (
                  <div>
                    <label htmlFor="severityCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      Severity Category *
                    </label>
                    <select
                      id="severityCategory"
                      value={formData.severityCategory || ''}
                      onChange={(e) => setFormData({ ...formData, severityCategory: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a severity category</option>
                      {selectedProject.severityCategories.map((category: string) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {hasSourceCategories && (
                  <div>
                    <label htmlFor="sourceCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      Source Category *
                    </label>
                    <select
                      id="sourceCategory"
                      value={formData.sourceCategory || ''}
                      onChange={(e) => setFormData({ ...formData, sourceCategory: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a source category</option>
                      {selectedProject.sourceCategories.map((category: string) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (workLog ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Work Log View Modal Component
interface WorkLogViewModalProps {
  workLog: WorkLog | null;
  isOpen: boolean;
  onClose: () => void;
}

function WorkLogViewModal({ workLog, isOpen, onClose }: WorkLogViewModalProps) {
  if (!workLog) return null;

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

     return (
     <Modal
       isOpen={isOpen}
       onClose={onClose}
       title="Work Log Details"
       size="lg"
     >
       <div className="space-y-6">
         {/* User and Project Info */}
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               User
             </label>
             <p className="text-sm text-gray-900">{workLog.userName}</p>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Project
             </label>
             <p className="text-sm text-gray-900">{workLog.projectName}</p>
           </div>
         </div>

         {/* Description */}
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">
             Description
           </label>
           <div className="bg-gray-50 p-3 rounded-md">
             <p className="text-sm text-gray-900 whitespace-pre-wrap">{workLog.description || 'No description provided'}</p>
           </div>
         </div>

         {/* Date and Duration */}
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Date
             </label>
             <p className="text-sm text-gray-900">{formatDate(workLog.startTime)}</p>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Duration
             </label>
             <p className="text-sm text-gray-900">{formatDuration(workLog.duration)}</p>
           </div>
         </div>

         {/* Start and End Time */}
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Start Time
             </label>
             <p className="text-sm text-gray-900">{formatTime(workLog.startTime)}</p>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               End Time
             </label>
             <p className="text-sm text-gray-900">{formatTime(workLog.endTime)}</p>
           </div>
         </div>

         {/* Billable and Status */}
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Billable
             </label>
             <div className="flex items-center">
               {workLog.isBillable ? (
                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                   <CheckCircle className="h-3 w-3 mr-1" />
                   Yes
                 </span>
               ) : (
                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                   <XCircle className="h-3 w-3 mr-1" />
                   No
                 </span>
               )}
             </div>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Status
             </label>
             <div className="flex items-center">
               {workLog.isApproved ? (
                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                   <CheckCircle className="h-3 w-3 mr-1" />
                   Approved
                 </span>
               ) : (
                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                   <XCircle className="h-3 w-3 mr-1" />
                   Pending
                 </span>
               )}
             </div>
           </div>
         </div>

         {/* Tags */}
         {workLog.tags && workLog.tags.length > 0 && (
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Tags
             </label>
             <div className="flex flex-wrap gap-2">
               {workLog.tags.map((tag, index) => (
                 <span
                   key={index}
                   className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                 >
                   {tag}
                 </span>
               ))}
             </div>
           </div>
         )}

         {/* Work Details */}
         {(workLog.module || workLog.taskCategory || workLog.workCategory || workLog.severityCategory || workLog.sourceCategory || workLog.ticketReference) && (
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Work Details
             </label>
             <div className="bg-gray-50 p-3 rounded-md space-y-2">
               {workLog.module && (
                 <div className="flex justify-between">
                   <span className="text-sm font-medium text-gray-600">Module:</span>
                   <span className="text-sm text-gray-900">{workLog.module}</span>
                 </div>
               )}
               {workLog.taskCategory && (
                 <div className="flex justify-between">
                   <span className="text-sm font-medium text-gray-600">Task Category:</span>
                   <span className="text-sm text-gray-900">{workLog.taskCategory}</span>
                 </div>
               )}
               {workLog.workCategory && (
                 <div className="flex justify-between">
                   <span className="text-sm font-medium text-gray-600">Work Category:</span>
                   <span className="text-sm text-gray-900">{workLog.workCategory}</span>
                 </div>
               )}
               {workLog.severityCategory && (
                 <div className="flex justify-between">
                   <span className="text-sm font-medium text-gray-600">Severity Category:</span>
                   <span className="text-sm text-gray-900">{workLog.severityCategory}</span>
                 </div>
               )}
               {workLog.sourceCategory && (
                 <div className="flex justify-between">
                   <span className="text-sm font-medium text-gray-600">Source Category:</span>
                   <span className="text-sm text-gray-900">{workLog.sourceCategory}</span>
                 </div>
               )}
               {workLog.ticketReference && (
                 <div className="flex justify-between">
                   <span className="text-sm font-medium text-gray-600">Ticket Reference:</span>
                   <span className="text-sm text-gray-900">{workLog.ticketReference}</span>
                 </div>
               )}
             </div>
           </div>
         )}

         {/* Approval Info */}
         {workLog.isApproved && workLog.approvedBy && (
           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Approved By
               </label>
               <p className="text-sm text-gray-900">{workLog.approvedBy}</p>
             </div>
             {workLog.approvedAt && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Approved At
                 </label>
                 <p className="text-sm text-gray-900">{formatDate(workLog.approvedAt)} {formatTime(workLog.approvedAt)}</p>
               </div>
             )}
           </div>
         )}

         {/* Created At */}
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">
             Created At
           </label>
           <p className="text-sm text-gray-900">{formatDate(workLog.createdAt)} {formatTime(workLog.createdAt)}</p>
         </div>

         <div className="flex justify-end pt-4 border-t">
           <Button variant="outline" onClick={onClose}>
             Close
           </Button>
         </div>
       </div>
     </Modal>
   );
} 