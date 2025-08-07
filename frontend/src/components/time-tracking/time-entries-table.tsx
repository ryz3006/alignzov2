'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { SmartActionButton } from '@/components/auth/smart-action-button';
import { TimeSessionsUpdatePermissionGuard, TimeSessionsDeletePermissionGuard, TimeSessionsExportPermissionGuard, TimeSessionsBulkActionsPermissionGuard } from '@/components/auth/page-permission-guard';
import { TimeSessionViewModal } from '@/components/forms/time-session-view-modal';
import { TimeSessionEditModal } from '@/components/forms/time-session-edit-modal';
import { 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  ArrowUpRight, 
  CheckSquare, 
  Square,
  Clock,
  Calendar,
  Download,
  Search,
  Filter
} from 'lucide-react';
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
  module?: string;
  taskCategory?: string;
  workCategory?: string;
  severityCategory?: string;
  sourceCategory?: string;
  ticketReference?: string;
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

interface TimeEntriesTableProps {
  timeSessions: TimeSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onDelete: (sessionId: string) => Promise<void>;
  onConvertToWorkLog: (sessionId: string) => Promise<void>;
  onUpdate: (sessionId: string, data: { description?: string; projectId?: string }) => Promise<void>;
  currentUserId: string;
  isLoading?: boolean;
  projects?: any[];
}

export function TimeEntriesTable({ 
  timeSessions, 
  pagination, 
  onPageChange, 
  onDelete, 
  onConvertToWorkLog,
  onUpdate,
  currentUserId,
  isLoading = false,
  projects = []
}: TimeEntriesTableProps) {
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showSingleConvertModal, setShowSingleConvertModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSingleDeleteModal, setShowSingleDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TimeSession | null>(null);
  const [sessionToConvert, setSessionToConvert] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatDuration = (startTime: string, endTime?: string, pausedDuration: number = 0) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime() - pausedDuration;
    const seconds = Math.floor(Math.max(0, durationMs) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAll = () => {
    const completedSessions = timeSessions.filter(
      session => session.status === 'COMPLETED' && session.user.id === currentUserId
    );
    const completedIds = completedSessions.map(session => session.id);
    
    if (selectedSessions.length === completedIds.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(completedIds);
    }
  };

  const handleDelete = async (sessionId: string) => {
    setIsDeleting(sessionId);
    try {
      await onDelete(sessionId);
      toast.success('Time entry deleted successfully');
    } catch (error) {
      toast.error('Failed to delete time entry');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessions.length === 0) {
      toast.error('Please select at least one time entry to delete');
      return;
    }

    setIsConverting(true);
    try {
      for (const sessionId of selectedSessions) {
        await onDelete(sessionId);
      }
      toast.success(`Successfully deleted ${selectedSessions.length} time entry(ies)`);
      setSelectedSessions([]);
      setShowDeleteModal(false);
    } catch (error) {
      toast.error('Failed to delete some time entries');
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertSelected = async () => {
    if (selectedSessions.length === 0) {
      toast.error('Please select at least one time entry to convert');
      return;
    }

    setIsConverting(true);
    try {
      for (const sessionId of selectedSessions) {
        await onConvertToWorkLog(sessionId);
      }
      toast.success(`Successfully converted ${selectedSessions.length} time entry(ies) to work log(s)`);
      setSelectedSessions([]);
      setShowConvertModal(false);
    } catch (error) {
      toast.error('Failed to convert some time entries');
    } finally {
      setIsConverting(false);
    }
  };

  const handleSingleConvert = async () => {
    if (!sessionToConvert) return;

    setIsConverting(true);
    try {
      await onConvertToWorkLog(sessionToConvert);
      toast.success('Time session converted to work log successfully');
      setShowSingleConvertModal(false);
      setSessionToConvert(null);
    } catch (error) {
      toast.error('Failed to convert time session to work log');
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertButtonClick = (sessionId: string) => {
    setSessionToConvert(sessionId);
    setShowSingleConvertModal(true);
  };

  const handleSingleDelete = async () => {
    if (!sessionToDelete) return;

    setIsDeleting(sessionToDelete);
    try {
      await onDelete(sessionToDelete);
      toast.success('Time entry deleted successfully');
      setShowSingleDeleteModal(false);
      setSessionToDelete(null);
    } catch (error) {
      toast.error('Failed to delete time entry');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteButtonClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setShowSingleDeleteModal(true);
  };

  const handleViewSession = (session: TimeSession) => {
    setSelectedSession(session);
    setShowViewModal(true);
  };

  const handleEditSession = (session: TimeSession) => {
    setSelectedSession(session);
    setShowEditModal(true);
  };

  const handleUpdateSession = async (sessionId: string, data: { description?: string; projectId?: string }) => {
    try {
      await onUpdate(sessionId, data);
      setShowEditModal(false);
      setSelectedSession(null);
    } catch (error) {
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const canConvertToWorkLog = (session: TimeSession) => {
    return session.status === 'COMPLETED' && 
           session.user.id === currentUserId && 
           session.endTime;
  };

  const canEditSession = (session: TimeSession) => {
    return session.user.id === currentUserId && 
           (session.status === 'RUNNING' || session.status === 'PAUSED');
  };

  const completedSessions = timeSessions.filter(session => session.status === 'COMPLETED');
  const allCompletedSelected = completedSessions.length > 0 && 
    completedSessions.every(session => 
      session.user.id === currentUserId && selectedSessions.includes(session.id)
    );

  // Filter sessions based on search and status
  const filteredSessions = timeSessions.filter(session => {
    const matchesSearch = !searchTerm || 
      session.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Export functionality
  const handleExport = () => {
    const csvContent = generateCSV(filteredSessions);
    downloadCSV(csvContent, 'time-sessions-export.csv');
    toast.success('Time sessions exported successfully');
  };

  const generateCSV = (sessions: TimeSession[]) => {
    const headers = [
      'Description', 
      'Project', 
      'User', 
      'Module',
      'Task Category',
      'Work Category',
      'Severity Category',
      'Source Category',
      'Ticket Reference',
      'Start Time', 
      'End Time', 
      'Duration', 
      'Status', 
      'Created'
    ];
    const rows = sessions.map(session => [
      session.description || 'No description',
      session.project?.name || `Project ${session.projectId}`,
      `${session.user.firstName} ${session.user.lastName}`,
      session.module || '',
      session.taskCategory || '',
      session.workCategory || '',
      session.severityCategory || '',
      session.sourceCategory || '',
      session.ticketReference || '',
      new Date(session.startTime).toLocaleString(),
      session.endTime ? new Date(session.endTime).toLocaleString() : '',
      formatDuration(session.startTime, session.endTime, session.pausedDuration),
      session.status,
      new Date(session.createdAt).toLocaleString()
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Header with search, filters, and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Time Entries
              </h3>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="RUNNING">Running</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {/* Export Button */}
              <TimeSessionsExportPermissionGuard>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center"
                  title="Export Time Entries to CSV"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </TimeSessionsExportPermissionGuard>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedSessions.length > 0 && (
            <TimeSessionsBulkActionsPermissionGuard>
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-indigo-700">
                    {selectedSessions.length} time entry(ies) selected
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowConvertModal(true)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      title="Convert Selected to Work Log"
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Convert to Work Log
                    </Button>
                    <Button
                      onClick={() => setShowDeleteModal(true)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      title="Delete Selected Time Entries"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </div>
            </TimeSessionsBulkActionsPermissionGuard>
          )}
          
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start tracking your time to see entries here.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          {completedSessions.length > 0 && (
                            <TimeSessionsBulkActionsPermissionGuard>
                              <button
                                onClick={handleSelectAll}
                                className="mr-2"
                                title={allCompletedSelected ? "Deselect All" : "Select All"}
                              >
                                {allCompletedSelected ? (
                                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                                ) : (
                                  <Square className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </TimeSessionsBulkActionsPermissionGuard>
                          )}
                          Entry
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Module
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categories
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket Ref
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {canConvertToWorkLog(session) && (
                              <TimeSessionsBulkActionsPermissionGuard>
                                <button
                                  onClick={() => handleSelectSession(session.id)}
                                  className="mr-2"
                                  title={selectedSessions.includes(session.id) ? "Deselect" : "Select"}
                                >
                                  {selectedSessions.includes(session.id) ? (
                                    <CheckSquare className="h-4 w-4 text-indigo-600" />
                                  ) : (
                                    <Square className="h-4 w-4 text-gray-400" />
                                  )}
                                </button>
                              </TimeSessionsBulkActionsPermissionGuard>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {session.description || 'No description'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {session.user.firstName} {session.user.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.project?.name || `Project ${session.projectId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.module || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            {session.taskCategory && (
                              <div className="text-xs">
                                <span className="font-medium">Task:</span> {session.taskCategory}
                              </div>
                            )}
                            {session.workCategory && (
                              <div className="text-xs">
                                <span className="font-medium">Work:</span> {session.workCategory}
                              </div>
                            )}
                            {session.severityCategory && (
                              <div className="text-xs">
                                <span className="font-medium">Severity:</span> {session.severityCategory}
                              </div>
                            )}
                            {session.sourceCategory && (
                              <div className="text-xs">
                                <span className="font-medium">Source:</span> {session.sourceCategory}
                              </div>
                            )}
                            {!session.taskCategory && !session.workCategory && !session.severityCategory && !session.sourceCategory && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.ticketReference || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(session.startTime, session.endTime, session.pausedDuration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(session.startTime)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatTime(session.startTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            session.status === 'RUNNING' 
                              ? 'bg-green-100 text-green-800'
                              : session.status === 'PAUSED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : session.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Smart Action Button */}
                            <SmartActionButton
                              resource="time_sessions"
                              onEdit={() => handleEditSession(session)}
                              onView={() => handleViewSession(session)}
                              variant="ghost"
                              size="sm"
                            />

                            {/* Convert to Work Log Button */}
                            {canConvertToWorkLog(session) && (
                              <TimeSessionsUpdatePermissionGuard>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleConvertButtonClick(session.id)}
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  title="Convert to Work Log"
                                >
                                  <ArrowUpRight className="h-4 w-4" />
                                </Button>
                              </TimeSessionsUpdatePermissionGuard>
                            )}

                            {/* Delete Button */}
                            <TimeSessionsDeletePermissionGuard>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteButtonClick(session.id)}
                                disabled={isDeleting === session.id}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                title="Delete Time Entry"
                              >
                                {isDeleting === session.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TimeSessionsDeletePermissionGuard>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="flex items-center px-3 py-2 text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Single Delete Confirmation Modal */}
      <Modal
        isOpen={showSingleDeleteModal}
        onClose={() => {
          setShowSingleDeleteModal(false);
          setSessionToDelete(null);
        }}
        title="Delete Time Entry"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this time entry? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSingleDeleteModal(false);
                setSessionToDelete(null);
              }}
              disabled={isDeleting === sessionToDelete}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSingleDelete}
              disabled={isDeleting === sessionToDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting === sessionToDelete ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Time Entry
                </div>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Single Convert to Work Log Confirmation Modal */}
      <Modal
        isOpen={showSingleConvertModal}
        onClose={() => {
          setShowSingleConvertModal(false);
          setSessionToConvert(null);
        }}
        title="Convert to Work Log"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to convert this time entry to a work log? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSingleConvertModal(false);
                setSessionToConvert(null);
              }}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSingleConvert}
              disabled={isConverting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isConverting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Converting...
                </div>
              ) : (
                <div className="flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Convert to Work Log
                </div>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Convert to Work Log Confirmation Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title="Convert to Work Log"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to convert {selectedSessions.length} time entry(ies) to work log(s)? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowConvertModal(false)}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertSelected}
              disabled={isConverting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isConverting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Converting...
                </div>
              ) : (
                <div className="flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Convert to Work Log
                </div>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Time Entries"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete {selectedSessions.length} time entry(ies)? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={isConverting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isConverting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </div>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View and Edit Modals */}
      <TimeSessionViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedSession(null);
        }}
        timeSession={selectedSession}
      />
      
      <TimeSessionEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSession(null);
        }}
        timeSession={selectedSession}
        projects={projects}
        onSave={handleUpdateSession}
      />
    </>
  );
} 