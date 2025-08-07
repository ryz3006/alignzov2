'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

interface WorkLogFormData {
  projectId: string;
  description: string;
  startTime: string;
  endTime: string;
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

interface Project {
  id: string;
  name: string;
  code: string;
  // Enhanced fields for better work reporting and time tracking
  modules?: string[];
  taskCategories?: string[];
  workCategories?: string[];
  severityCategories?: string[];
  sourceCategories?: string[];
}

interface WorkLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkLogFormData) => void;
  workLog: WorkLog | null;
  projects: Project[];
  isLoading: boolean;
}

export function WorkLogFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  workLog, 
  projects, 
  isLoading 
}: WorkLogFormModalProps) {
  const [formData, setFormData] = useState<WorkLogFormData>({
    projectId: '',
    description: '',
    startTime: '',
    endTime: '',
    isBillable: false,
    tags: [],
    // Enhanced fields for better work reporting and time tracking
    module: '',
    taskCategory: '',
    workCategory: '',
    severityCategory: '',
    sourceCategory: '',
    ticketReference: '',
  });

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
        isBillable: workLog.isBillable || false,
        tags: workLog.tags || [],
        // Enhanced fields for better work reporting and time tracking
        module: workLog.module || '',
        taskCategory: workLog.taskCategory || '',
        workCategory: workLog.workCategory || '',
        severityCategory: workLog.severityCategory || '',
        sourceCategory: workLog.sourceCategory || '',
        ticketReference: workLog.ticketReference || '',
      });
    } else {
      setFormData({
        projectId: '',
        description: '',
        startTime: '',
        endTime: '',
        isBillable: false,
        tags: [],
        // Enhanced fields for better work reporting and time tracking
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
    onSubmit(formData);
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

        {/* Enhanced Work Details */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Work Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-1">
                Module
              </label>
              <select
                id="module"
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select a module</option>
                {formData.projectId && projects.find(p => p.id === formData.projectId)?.modules?.map((module: string) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="taskCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Task Category
              </label>
              <select
                id="taskCategory"
                value={formData.taskCategory}
                onChange={(e) => setFormData({ ...formData, taskCategory: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select a task category</option>
                {formData.projectId && projects.find(p => p.id === formData.projectId)?.taskCategories?.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="workCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Work Category
              </label>
              <select
                id="workCategory"
                value={formData.workCategory}
                onChange={(e) => setFormData({ ...formData, workCategory: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select a work category</option>
                {formData.projectId && projects.find(p => p.id === formData.projectId)?.workCategories?.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="severityCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Severity Category
              </label>
              <select
                id="severityCategory"
                value={formData.severityCategory}
                onChange={(e) => setFormData({ ...formData, severityCategory: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select a severity category</option>
                {formData.projectId && projects.find(p => p.id === formData.projectId)?.severityCategories?.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sourceCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Source Category
              </label>
              <select
                id="sourceCategory"
                value={formData.sourceCategory}
                onChange={(e) => setFormData({ ...formData, sourceCategory: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select a source category</option>
                {formData.projectId && projects.find(p => p.id === formData.projectId)?.sourceCategories?.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ticketReference" className="block text-sm font-medium text-gray-700 mb-1">
                Ticket Reference
              </label>
              <input
                type="text"
                id="ticketReference"
                value={formData.ticketReference}
                onChange={(e) => setFormData({ ...formData, ticketReference: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ticket ID or email subject"
              />
            </div>
          </div>
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