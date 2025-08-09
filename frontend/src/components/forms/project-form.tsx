'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import toast from 'react-hot-toast';
import { FolderOpen, Users, Calendar, DollarSign, X, Plus } from 'lucide-react';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().optional(),
  code: z.string().min(1, 'Project code is required').max(20, 'Project code must be less than 20 characters'),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
  currency: z.string().optional(),
  clientName: z.string().optional(),
  ownerId: z.string().min(1, 'Project owner is required'),
  teamIds: z.array(z.string()).optional(),
  modules: z.array(z.string()).optional(),
  taskCategories: z.array(z.string()).optional(),
  workCategories: z.array(z.string()).optional(),
  severityCategories: z.array(z.string()).optional(),
  sourceCategories: z.array(z.string()).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  title?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  leader: {
    id: string;
    displayName: string;
  };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  code: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency: string;
  clientName?: string;
  ownerId: string;
  teams: Array<{
    id: string;
    team: Team;
  }>;
}

interface ProjectFormProps {
  project?: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectForm({ project, isOpen, onClose, onSuccess }: ProjectFormProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [taskCategories, setTaskCategories] = useState<string[]>([]);
  const [workCategories, setWorkCategories] = useState<string[]>([]);
  const [severityCategories, setSeverityCategories] = useState<string[]>([]);
  const [sourceCategories, setSourceCategories] = useState<string[]>([]);
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
      status: 'PLANNING',
      priority: 'MEDIUM',
      startDate: '',
      endDate: '',
      budget: '',
      currency: 'USD',
      clientName: '',
      ownerId: '',
      teamIds: [],
    },
  });

  // Fetch users for owner selection
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiCall('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      return data || [];
    },
  });

  // Fetch teams for assignment
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await apiCall('/api/teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      return data || [];
    },
  });

  // Create/Update project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await apiCall('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Project created successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Reset form to clear all fields
      reset();
      setSelectedTeams([]);
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await apiCall(`/api/projects/${project?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update project');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Project updated successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Initialize form when project data is available
  useEffect(() => {
    if (project) {
      setValue('name', project.name);
      setValue('description', project.description || '');
      setValue('code', project.code);
      setValue('status', project.status as any);
      setValue('priority', project.priority as any);
      // Convert ISO dates to YYYY-MM-DD format for date inputs
      setValue('startDate', project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
      setValue('endDate', project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '');
      setValue('budget', typeof project.budget === 'number' ? String(project.budget) : '');
      setValue('currency', project.currency);
      setValue('clientName', project.clientName || '');
      setValue('ownerId', project.ownerId);
      setSelectedTeams(project.teams ? project.teams.map(t => t.team.id) : []);
      // Initialize new project-level attributes
      setModules(project.modules || []);
      setTaskCategories(project.taskCategories || []);
      setWorkCategories(project.workCategories || []);
      setSeverityCategories(project.severityCategories || []);
      setSourceCategories(project.sourceCategories || []);
    } else if (isOpen) {
      // Reset form when opening modal for new project creation
      reset();
      setSelectedTeams([]);
      setModules([]);
      setTaskCategories([]);
      setWorkCategories([]);
      setSeverityCategories([]);
      setSourceCategories([]);
    }
  }, [project, isOpen, setValue, reset]);

  const onSubmit = (data: ProjectFormData) => {
    try {
      const formData = {
        ...data,
        teamIds: selectedTeams,
        modules: modules,
        taskCategories: taskCategories,
        workCategories: workCategories,
        severityCategories: severityCategories,
        sourceCategories: sourceCategories,
        // Convert date strings to ISO-8601 format
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        budget: data.budget && data.budget !== '' ? Number(data.budget) : undefined,
      };

      if (project) {
        updateProjectMutation.mutate(formData);
      } else {
        createProjectMutation.mutate(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to submit form. Please try again.');
    }
  };

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Helper functions for managing dynamic arrays
  const addModule = () => {
    const newModule = prompt('Enter module name:');
    if (newModule && newModule.trim()) {
      setModules(prev => [...prev, newModule.trim()]);
    }
  };

  const removeModule = (index: number) => {
    setModules(prev => prev.filter((_, i) => i !== index));
  };

  const addTaskCategory = () => {
    const newCategory = prompt('Enter task category:');
    if (newCategory && newCategory.trim()) {
      setTaskCategories(prev => [...prev, newCategory.trim()]);
    }
  };

  const removeTaskCategory = (index: number) => {
    setTaskCategories(prev => prev.filter((_, i) => i !== index));
  };

  const addWorkCategory = () => {
    const newCategory = prompt('Enter work category:');
    if (newCategory && newCategory.trim()) {
      setWorkCategories(prev => [...prev, newCategory.trim()]);
    }
  };

  const removeWorkCategory = (index: number) => {
    setWorkCategories(prev => prev.filter((_, i) => i !== index));
  };

  const addSeverityCategory = () => {
    const newCategory = prompt('Enter severity category:');
    if (newCategory && newCategory.trim()) {
      setSeverityCategories(prev => [...prev, newCategory.trim()]);
    }
  };

  const removeSeverityCategory = (index: number) => {
    setSeverityCategories(prev => prev.filter((_, i) => i !== index));
  };

  const addSourceCategory = () => {
    const newCategory = prompt('Enter source category:');
    if (newCategory && newCategory.trim()) {
      setSourceCategories(prev => [...prev, newCategory.trim()]);
    }
  };

  const removeSourceCategory = (index: number) => {
    setSourceCategories(prev => prev.filter((_, i) => i !== index));
  };

  const watchedOwnerId = watch('ownerId');

  // Handle modal close with form reset
  const handleClose = () => {
    // Always reset form and close modal, regardless of validation state
    if (!project) {
      // Only reset form when creating new project (not editing)
      reset();
      setSelectedTeams([]);
    }
    // Force close the modal
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={project ? 'Edit Project' : 'Create Project'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter project name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Project Code */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Project Code *
            </label>
            <Input
              id="code"
              {...register('code')}
              placeholder="e.g., WEB-001"
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          {/* Client Name */}
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
              Client Name
            </label>
            <Input
              id="clientName"
              {...register('clientName')}
              placeholder="Enter client name"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              id="priority"
              {...register('priority')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <Input
              id="startDate"
              type="date"
              {...register('startDate')}
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <Input
              id="endDate"
              type="date"
              {...register('endDate')}
            />
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Budget
            </label>
            <div className="relative">
                             <Input
                 id="budget"
                 type="number"
                 step="0.01"
                 {...register('budget')}
                 placeholder="0.00"
               />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              id="currency"
              {...register('currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            placeholder="Enter project description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Project Owner */}
        <div>
          <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700 mb-2">
            Project Owner *
          </label>
          <select
            id="ownerId"
            {...register('ownerId')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.ownerId ? 'border-red-500' : ''
            }`}
          >
            <option value="">Select a project owner</option>
            {(users || []).map((user: User) => (
              <option key={user.id} value={user.id}>
                {user.displayName} ({user.email})
              </option>
            ))}
          </select>
          {errors.ownerId && (
            <p className="mt-1 text-sm text-red-600">{errors.ownerId.message}</p>
          )}
        </div>

        {/* Team Assignments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign Teams
          </label>
          
          {/* Selected Teams */}
          {selectedTeams.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Teams:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTeams.map(teamId => {
                  const team = (teams || []).find((t: Team) => t.id === teamId);
                  return team ? (
                    <div
                      key={teamId}
                      className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      <Users className="h-4 w-4" />
                      <span>{team.name}</span>
                      <button
                        type="button"
                        onClick={() => handleTeamToggle(teamId)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Available Teams */}
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {(teams || []).map((team: Team) => (
              <div
                key={team.id}
                className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                  selectedTeams.includes(team.id) ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{team.name}</div>
                    <div className="text-sm text-gray-500">Lead: {team.leader?.displayName || 'Not assigned'}</div>
                    {team.description && (
                      <div className="text-xs text-gray-400">{team.description}</div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTeamToggle(team.id)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    selectedTeams.includes(team.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedTeams.includes(team.id) ? 'Remove' : 'Assign'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Project-Level Attributes for Enhanced Work Reporting */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Project-Level Attributes</h3>
          
          {/* Modules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modules
            </label>
            <div className="space-y-2">
              {modules.map((module, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={module}
                    onChange={(e) => {
                      const newModules = [...modules];
                      newModules[index] = e.target.value;
                      setModules(newModules);
                    }}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeModule(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addModule}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Module
              </button>
            </div>
          </div>

          {/* Task Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Categories
            </label>
            <div className="space-y-2">
              {taskCategories.map((category, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={category}
                    onChange={(e) => {
                      const newCategories = [...taskCategories];
                      newCategories[index] = e.target.value;
                      setTaskCategories(newCategories);
                    }}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeTaskCategory(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTaskCategory}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Task Category
              </button>
            </div>
          </div>

          {/* Work Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Categories
            </label>
            <div className="space-y-2">
              {workCategories.map((category, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={category}
                    onChange={(e) => {
                      const newCategories = [...workCategories];
                      newCategories[index] = e.target.value;
                      setWorkCategories(newCategories);
                    }}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeWorkCategory(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addWorkCategory}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Work Category
              </button>
            </div>
          </div>

          {/* Severity Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity Categories
            </label>
            <div className="space-y-2">
              {severityCategories.map((category, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={category}
                    onChange={(e) => {
                      const newCategories = [...severityCategories];
                      newCategories[index] = e.target.value;
                      setSeverityCategories(newCategories);
                    }}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeSeverityCategory(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSeverityCategory}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Severity Category
              </button>
            </div>
          </div>

          {/* Source Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Categories
            </label>
            <div className="space-y-2">
              {sourceCategories.map((category, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={category}
                    onChange={(e) => {
                      const newCategories = [...sourceCategories];
                      newCategories[index] = e.target.value;
                      setSourceCategories(newCategories);
                    }}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeSourceCategory(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSourceCategory}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Source Category
              </button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FolderOpen className="h-4 w-4" />
            )}
            {project ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
} 