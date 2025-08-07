'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLoading } from '@/lib/loading-context';
import toast from 'react-hot-toast';

interface PermissionFormProps {
  permission?: {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    resource: string;
    action: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const RESOURCES = [
  'users',
  'projects',
  'time_logs',
  'teams',
  'roles',
  'permissions',
  'system',
  'reports',
  'settings',
];

const ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'approve',
  'export',
  'import',
  'manage',
];

export function PermissionForm({ permission, onSuccess, onCancel }: PermissionFormProps) {
  const [formData, setFormData] = useState({
    name: permission?.name || '',
    displayName: permission?.displayName || '',
    description: permission?.description || '',
    resource: permission?.resource || 'users',
    action: permission?.action || 'read',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { apiCall } = useAuth();
  const { withLoading } = useLoading();
  const queryClient = useQueryClient();

  const createPermissionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiCall('/api/permissions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create permission');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission created successfully');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiCall(`/api/permissions/${permission!.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update permission');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission updated successfully');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Permission name is required';
    } else if (!/^[a-z]+\.[a-z_]+$/.test(formData.name)) {
      newErrors.name = 'Permission name must be in format: resource.action';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.resource) {
      newErrors.resource = 'Resource is required';
    }

    if (!formData.action) {
      newErrors.action = 'Action is required';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Auto-generate name if not provided
    const finalData = {
      ...formData,
      name: formData.name || `${formData.resource}.${formData.action}`,
    };

    await withLoading(async () => {
      if (permission) {
        await updatePermissionMutation.mutateAsync(finalData);
      } else {
        await createPermissionMutation.mutateAsync(finalData);
      }
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isSubmitting = createPermissionMutation.isPending || updatePermissionMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Permission Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Permission Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="e.g., users.create (auto-generated if empty)"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Format: resource.action (e.g., users.create). Leave empty to auto-generate.
        </p>
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
          Display Name *
        </label>
        <input
          type="text"
          id="displayName"
          value={formData.displayName}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.displayName ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="e.g., Create Users"
        />
        {errors.displayName && (
          <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
        )}
      </div>

      {/* Resource */}
      <div>
        <label htmlFor="resource" className="block text-sm font-medium text-gray-700">
          Resource *
        </label>
        <select
          id="resource"
          value={formData.resource}
          onChange={(e) => handleInputChange('resource', e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.resource ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          {RESOURCES.map(resource => (
            <option key={resource} value={resource}>
              {resource.charAt(0).toUpperCase() + resource.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
        {errors.resource && (
          <p className="mt-1 text-sm text-red-600">{errors.resource}</p>
        )}
      </div>

      {/* Action */}
      <div>
        <label htmlFor="action" className="block text-sm font-medium text-gray-700">
          Action *
        </label>
        <select
          id="action"
          value={formData.action}
          onChange={(e) => handleInputChange('action', e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.action ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          {ACTIONS.map(action => (
            <option key={action} value={action}>
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </option>
          ))}
        </select>
        {errors.action && (
          <p className="mt-1 text-sm text-red-600">{errors.action}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Describe what this permission allows..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : permission ? 'Update Permission' : 'Create Permission'}
        </button>
      </div>
    </form>
  );
} 