'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface WorkLog {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
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
}

interface WorkLogViewModalProps {
  workLog: WorkLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkLogViewModal({ workLog, isOpen, onClose }: WorkLogViewModalProps) {
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <p className="text-sm text-gray-900">{workLog.description}</p>
        </div>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billable
            </label>
            <p className="text-sm text-gray-900">
              {workLog.isBillable ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <p className="text-sm text-gray-900">
              {workLog.isApproved ? 'Approved' : 'Pending'}
            </p>
          </div>
        </div>

        {workLog.tags && workLog.tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {workLog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
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

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
} 