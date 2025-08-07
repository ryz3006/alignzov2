'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, User, FileText, Play, Pause, Square } from 'lucide-react';

interface TimeSession {
  id: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
  description?: string;
  startTime: string;
  endTime?: string;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  pausedDuration?: number;
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

interface TimeSessionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeSession: TimeSession | null;
}

export function TimeSessionViewModal({ isOpen, onClose, timeSession }: TimeSessionViewModalProps) {
  if (!timeSession) return null;

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'PAUSED':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'COMPLETED':
        return <Square className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Time Session Details" size="lg">
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-sm text-gray-900">
                  {timeSession.description || 'No description provided'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1 flex items-center space-x-2">
                  {getStatusIcon(timeSession.status)}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(timeSession.status)}`}>
                    {timeSession.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Duration</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">
                  {formatDuration(timeSession.startTime, timeSession.endTime, timeSession.pausedDuration)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Project</label>
                <p className="mt-1 text-sm text-gray-900">
                  {timeSession.project?.name || `Project ${timeSession.projectId}`}
                </p>
                {timeSession.project?.code && (
                  <p className="mt-1 text-xs text-gray-500">Code: {timeSession.project.code}</p>
                )}
              </div>

              {timeSession.project?.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Project Description</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {timeSession.project.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Work Details */}
        {(timeSession.module || timeSession.taskCategory || timeSession.workCategory || timeSession.severityCategory || timeSession.sourceCategory || timeSession.ticketReference) && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Work Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {timeSession.module && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Module</label>
                    <p className="mt-1 text-sm text-gray-900">{timeSession.module}</p>
                  </div>
                )}
                
                {timeSession.taskCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Task Category</label>
                    <p className="mt-1 text-sm text-gray-900">{timeSession.taskCategory}</p>
                  </div>
                )}

                {timeSession.workCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Work Category</label>
                    <p className="mt-1 text-sm text-gray-900">{timeSession.workCategory}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {timeSession.severityCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Severity Category</label>
                    <p className="mt-1 text-sm text-gray-900">{timeSession.severityCategory}</p>
                  </div>
                )}

                {timeSession.sourceCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Source Category</label>
                    <p className="mt-1 text-sm text-gray-900">{timeSession.sourceCategory}</p>
                  </div>
                )}

                {timeSession.ticketReference && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Ticket Reference</label>
                    <p className="mt-1 text-sm text-gray-900">{timeSession.ticketReference}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {timeSession.user.firstName} {timeSession.user.lastName}
              </p>
              <p className="text-sm text-gray-500">{timeSession.user.email}</p>
            </div>
          </div>
        </div>

        {/* Timing Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Timing Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Start Time</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{formatDate(timeSession.startTime)}</span>
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{formatTime(timeSession.startTime)}</span>
                </div>
              </div>

              {timeSession.endTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">End Time</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{formatDate(timeSession.endTime)}</span>
                  </div>
                  <div className="mt-1 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{formatTime(timeSession.endTime)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{formatDate(timeSession.createdAt)}</span>
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{formatTime(timeSession.createdAt)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{formatDate(timeSession.updatedAt)}</span>
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{formatTime(timeSession.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Paused Duration Information */}
        {timeSession.pausedDuration && timeSession.pausedDuration > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pause Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-500">Total Paused Time</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">
                {Math.floor(timeSession.pausedDuration / 1000 / 60)} minutes
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
} 