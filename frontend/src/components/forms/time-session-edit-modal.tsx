'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Calendar, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
}

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

interface TimeSessionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeSession: TimeSession | null;
  projects: Project[];
  onSave: (sessionId: string, data: { description?: string; projectId?: string }) => Promise<void>;
}

export function TimeSessionEditModal({ 
  isOpen, 
  onClose, 
  timeSession, 
  projects, 
  onSave 
}: TimeSessionEditModalProps) {
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (timeSession) {
      setDescription(timeSession.description || '');
      setProjectId(timeSession.projectId);
      setErrors({});
    }
  }, [timeSession]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!projectId) {
      newErrors.projectId = 'Project is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!timeSession) return;

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(timeSession.id, {
        description: description.trim(),
        projectId,
      });
      toast.success('Time session updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update time session');
    } finally {
      setIsLoading(false);
    }
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

  if (!timeSession) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Time Session" size="lg">
      <div className="space-y-6">
        {/* Read-only Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Session Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-500">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(timeSession.status)}`}>
                {timeSession.status}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">User</label>
              <p className="text-gray-900">{timeSession.user.firstName} {timeSession.user.lastName}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Start Time</label>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-gray-900">{formatDate(timeSession.startTime)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-gray-900">{formatTime(timeSession.startTime)}</span>
              </div>
            </div>
            {timeSession.endTime && (
              <div>
                <label className="block text-xs font-medium text-gray-500">End Time</label>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-900">{formatDate(timeSession.endTime)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-900">{formatTime(timeSession.endTime)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <div className="mt-1">
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter session description"
                className={errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {errors.description && (
                <div className="mt-1 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-600">{errors.description}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700">
              Project *
            </label>
            <div className="mt-1">
              <select
                id="project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                  errors.projectId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.code && `(${project.code})`}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <div className="mt-1 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-600">{errors.projectId}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Work Details (Read-only) */}
        {(timeSession.module || timeSession.taskCategory || timeSession.workCategory || timeSession.severityCategory || timeSession.sourceCategory || timeSession.ticketReference) && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Work Details (Read-only)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {timeSession.module && (
                <div>
                  <label className="block text-xs font-medium text-gray-500">Module</label>
                  <p className="text-gray-900">{timeSession.module}</p>
                </div>
              )}
              
              {timeSession.taskCategory && (
                <div>
                  <label className="block text-xs font-medium text-gray-500">Task Category</label>
                  <p className="text-gray-900">{timeSession.taskCategory}</p>
                </div>
              )}

              {timeSession.workCategory && (
                <div>
                  <label className="block text-xs font-medium text-gray-500">Work Category</label>
                  <p className="text-gray-900">{timeSession.workCategory}</p>
                </div>
              )}

              {timeSession.severityCategory && (
                <div>
                  <label className="block text-xs font-medium text-gray-500">Severity Category</label>
                  <p className="text-gray-900">{timeSession.severityCategory}</p>
                </div>
              )}

              {timeSession.sourceCategory && (
                <div>
                  <label className="block text-xs font-medium text-gray-500">Source Category</label>
                  <p className="text-gray-900">{timeSession.sourceCategory}</p>
                </div>
              )}

              {timeSession.ticketReference && (
                <div>
                  <label className="block text-xs font-medium text-gray-500">Ticket Reference</label>
                  <p className="text-gray-900">{timeSession.ticketReference}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: These work details are set when the timer is started and cannot be modified after creation.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
} 