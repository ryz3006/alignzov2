'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { TimeTrackingPageGuard, TimeSessionsCreatePermissionGuard } from '@/components/auth/page-permission-guard';
import { TimeEntryModal } from '@/components/forms/time-entry-modal';
import { ActiveTimers } from '@/components/time-tracking/active-timers';
import { TimeEntriesTable } from '@/components/time-tracking/time-entries-table';
import {
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface TimeSession {
  id: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    code: string;
  };
  description?: string;
  startTime: string;
  endTime?: string;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  pausedDuration?: number; // Total paused time in milliseconds
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  modules?: string[];
  taskCategories?: string[];
  workCategories?: string[];
  severityCategories?: string[];
  sourceCategories?: string[];
}

interface TimeSessionsResponse {
  data: TimeSession[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const mockProjects: Project[] = [
  { id: '1', name: 'Website Redesign', description: 'Complete redesign of the company website' },
  { id: '2', name: 'Mobile App Development', description: 'iOS and Android app development' },
  { id: '3', name: 'Data Migration', description: 'Migrate legacy data to new cloud infrastructure' },
];

export default function TimeTrackingPage() {
  return (
    <TimeTrackingPageGuard>
      <TimeTrackingPageContent />
    </TimeTrackingPageGuard>
  );
}

function TimeTrackingPageContent() {
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [showActiveTimers, setShowActiveTimers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingOverlay, setIsLoadingOverlay] = useState(false);
  const { apiCall, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch time sessions with pagination and filters
  const { data: timeSessionsResponse, isLoading, error } = useQuery<TimeSessionsResponse>({
    queryKey: ['timeSessions', currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
        });

        const response = await apiCall(`/api/time-sessions?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch time sessions');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching time sessions:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: projects = mockProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const response = await apiCall('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching projects:', error);
        // Return mock projects as fallback
        return mockProjects;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const timeSessions = timeSessionsResponse?.data || [];
  const pagination = timeSessionsResponse?.meta || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  // Timer actions mutation
  const timerActionMutation = useMutation({
    mutationFn: async ({ action, sessionId }: { action: string; sessionId: string }) => {
      setIsLoadingOverlay(true);
      try {
        const response = await apiCall(`/api/time-sessions/${sessionId}/${action}`, {
          method: 'PATCH',
        });
        if (!response.ok) {
          throw new Error(`Failed to ${action} timer`);
        }
        return response.json();
      } finally {
        setIsLoadingOverlay(false);
      }
    },
    onMutate: async ({ action, sessionId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['timeSessions'] });

      // Snapshot the previous value
      const previousTimeSessions = queryClient.getQueryData(['timeSessions', currentPage, searchTerm, statusFilter]);

      // Optimistically update to the new value
      queryClient.setQueryData(['timeSessions', currentPage, searchTerm, statusFilter], (old: any) => {
        if (!old?.data) return old;
        
        const updatedData = old.data.map((session: TimeSession) => {
          if (session.id === sessionId) {
            if (action === 'pause') {
              return { 
                ...session, 
                status: 'PAUSED', 
                endTime: new Date().toISOString(),
                metadata: {
                  ...session.metadata,
                  pauseStartTime: new Date().toISOString(),
                }
              };
            } else if (action === 'resume') {
              // Calculate additional paused time
              const pauseStartTime = session.metadata?.pauseStartTime;
              let additionalPausedTime = 0;
              
              if (pauseStartTime) {
                const pauseStart = new Date(pauseStartTime);
                const resumeTime = new Date();
                additionalPausedTime = resumeTime.getTime() - pauseStart.getTime();
              }
              
              const totalPausedDuration = (session.pausedDuration || 0) + additionalPausedTime;
              
              return { 
                ...session, 
                status: 'RUNNING', 
                endTime: null,
                pausedDuration: totalPausedDuration,
                metadata: {
                  ...session.metadata,
                  pauseStartTime: null,
                }
              };
            } else if (action === 'stop') {
              return { ...session, status: 'COMPLETED', endTime: new Date().toISOString() };
            }
          }
          return session;
        });

        return { ...old, data: updatedData };
      });

      // Return a context object with the snapshotted value
      return { previousTimeSessions };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTimeSessions) {
        queryClient.setQueryData(['timeSessions', currentPage, searchTerm, statusFilter], context.previousTimeSessions);
      }
      toast.error(err.message || 'Failed to perform timer action');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['timeSessions'] });
    },
    onSuccess: () => {
      toast.success('Timer action completed successfully');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      setIsLoadingOverlay(true);
      try {
        const response = await apiCall(`/api/time-sessions/${sessionId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete time session');
        }
        return response.json();
      } finally {
        setIsLoadingOverlay(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSessions'] });
      toast.success('Time session deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete time session');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: { description?: string; projectId?: string } }) => {
      setIsLoadingOverlay(true);
      try {
        const response = await apiCall(`/api/time-sessions/${sessionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error('Failed to update time session');
        }
        return response.json();
      } finally {
        setIsLoadingOverlay(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSessions'] });
      toast.success('Time session updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update time session');
    },
  });

  // Convert to work log mutation
  const convertToWorkLogMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      setIsLoadingOverlay(true);
      try {
        const response = await apiCall(`/api/time-sessions/${sessionId}/convert-to-work-log`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error('Failed to convert time session to work log');
        }
        return response.json();
      } finally {
        setIsLoadingOverlay(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSessions'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      toast.success('Time session converted to work log successfully');
    },
    onError: (error) => {
      toast.error('Failed to convert time session to work log');
    },
  });

  const handleTimerAction = async (action: string, sessionId: string) => {
    if (!sessionId) {
      toast.error('Invalid session ID');
      return;
    }
    await timerActionMutation.mutateAsync({ action, sessionId });
  };

  const handleDelete = async (sessionId: string) => {
    if (!sessionId) {
      toast.error('Invalid session ID');
      return;
    }
    await deleteMutation.mutateAsync(sessionId);
  };

  const handleUpdate = async (sessionId: string, data: { description?: string; projectId?: string }) => {
    if (!sessionId) {
      toast.error('Invalid session ID');
      return;
    }
    await updateMutation.mutateAsync({ sessionId, data });
  };

  const handleConvertToWorkLog = async (sessionId: string) => {
    if (!sessionId) {
      toast.error('Invalid session ID');
      return;
    }
    await convertToWorkLogMutation.mutateAsync(sessionId);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };



  // Determine which dot to show based on timer status
  const getTimerIndicator = () => {
    const activeSessionsCount = timeSessions.filter(
      session => session.status === 'RUNNING' && session.user.id === user?.id
    ).length;
    
    const pausedSessionsCount = timeSessions.filter(
      session => session.status === 'PAUSED' && session.user.id === user?.id
    ).length;

    if (activeSessionsCount > 0) {
      return (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
      );
    } else if (pausedSessionsCount > 0) {
      return (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full"></div>
      );
    }
    return null;
  };

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to load time tracking data
            </h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
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
      {/* Loading Overlay */}
      {isLoadingOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-gray-700">Processing...</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your time and monitor productivity.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              onClick={() => setShowActiveTimers(!showActiveTimers)}
              variant="outline"
              className="inline-flex items-center relative"
            >
              {showActiveTimers ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Timers
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Timers
                </>
              )}
              {/* Timer status indicator */}
              {getTimerIndicator()}
            </Button>
            <TimeSessionsCreatePermissionGuard>
              <Button
                onClick={() => setShowTimeEntryModal(true)}
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Entry
              </Button>
            </TimeSessionsCreatePermissionGuard>
          </div>
        </div>



        {/* Active Timers Section */}
        {showActiveTimers && (
          <ActiveTimers
            timeSessions={timeSessions}
            onTimerAction={handleTimerAction}
            currentUserId={user?.id || ''}
          />
        )}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="mt-1 relative">
                <Input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search time entries..."
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">All Entries</option>
                <option value="RUNNING">Running</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Time Entries Table */}
        <TimeEntriesTable
          timeSessions={timeSessions}
          pagination={pagination}
          onPageChange={handlePageChange}
          onDelete={handleDelete}
          onConvertToWorkLog={handleConvertToWorkLog}
          onUpdate={handleUpdate}
          currentUserId={user?.id || ''}
          isLoading={isLoading}
          projects={projects}
        />
      </div>

      {/* Time Entry Modal */}
      <TimeEntryModal
        isOpen={showTimeEntryModal}
        onClose={() => setShowTimeEntryModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['timeSessions'] });
          // Automatically show active timers when a new timer is started
          setShowActiveTimers(true);
        }}
        projects={projects}
        apiCall={apiCall}
      />
    </DashboardLayout>
  );
} 