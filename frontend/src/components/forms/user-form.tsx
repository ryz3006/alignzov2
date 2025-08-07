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
import { User, Users, Building, Briefcase, X } from 'lucide-react';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  managerId: z.string().optional(), // Organizational reporting manager
  teamIds: z.array(z.string()).optional(),
  projectAssignments: z.array(z.object({
    projectId: z.string(),
    reportingToId: z.string().optional(), // Project-specific reporting manager
  })).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  title?: string;
  department?: string;
  phone?: string;
  managerId?: string;
  manager?: {
    id: string;
    displayName: string;
  };
  teamMembers: Array<{
    id: string;
    team: {
      id: string;
      name: string;
    };
    role: string;
  }>;
  projectMembers: Array<{
    id: string;
    project: {
      id: string;
      name: string;
      code: string;
    };
    role: string;
    reportingToId?: string;
    reportingTo?: {
      id: string;
      displayName: string;
    };
  }>;
}

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface UserFormProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  readOnly?: boolean;
}

export function UserForm({ user, isOpen, onClose, onSuccess, readOnly = false }: UserFormProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<Array<{
    projectId: string;
    reportingToId?: string;
    role?: string;
  }>>([]);
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      title: '',
      department: '',
      phone: '',
      managerId: '',
      teamIds: [],
      projectAssignments: [],
    },
  });

  // Fetch users for manager selection
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

  // Fetch projects for assignment
  const { data: projects = [] } = useQuery({
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

  // Create/Update user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiCall('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      console.log('updateUserMutation - sending data:', data);
      const response = await apiCall(`/api/users/${user?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('updateUserMutation - error response:', error);
        throw new Error(error.message || 'Failed to update user');
      }
      const result = await response.json();
      console.log('updateUserMutation - success response:', result);
      return result;
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Initialize form when user data is available
  useEffect(() => {
    if (user) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
      setValue('email', user.email);
      setValue('title', user.title || '');
      setValue('department', user.department || '');
      setValue('phone', user.phone || '');
      setValue('managerId', user.managerId || '');
      
      // Handle teamMembers safely
      if (user.teamMembers && Array.isArray(user.teamMembers)) {
        setSelectedTeams(user.teamMembers.map(tm => tm.team.id));
      } else {
        setSelectedTeams([]);
      }
      
      // Handle projectMembers safely
      if (user.projectMembers && Array.isArray(user.projectMembers)) {
        const projectAssignmentsData = user.projectMembers.map(pm => ({
          projectId: pm.project.id,
          reportingToId: pm.reportingToId,
          role: pm.role,
        }));
        
        setProjectAssignments(projectAssignmentsData);
      } else {
        setProjectAssignments([]);
      }
    } else {
      reset();
      setSelectedTeams([]);
      setProjectAssignments([]);
    }
  }, [user, setValue, reset]);

  const onSubmit = (data: UserFormData) => {
    const formData = {
      ...data,
      teamIds: selectedTeams,
      projectAssignments,
    };

    console.log('UserForm onSubmit - formData being sent:', formData);
    console.log('UserForm onSubmit - projectAssignments:', projectAssignments);

    if (user) {
      updateUserMutation.mutate(formData);
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleProjectAssignment = (projectId: string, reportingToId?: string, role?: string) => {
    setProjectAssignments(prev => {
      const existing = prev.find(p => p.projectId === projectId);
      if (existing) {
        return prev.map(p => 
          p.projectId === projectId 
            ? { ...p, reportingToId, role: role || p.role }
            : p
        );
      } else {
        return [...prev, { projectId, reportingToId, role: role || 'member' }];
      }
    });
  };

  const removeProjectAssignment = (projectId: string) => {
    setProjectAssignments(prev => prev.filter(p => p.projectId !== projectId));
  };

  const watchedManagerId = watch('managerId');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={readOnly ? `View User: ${user?.firstName} ${user?.lastName}` : (user ? 'Edit User' : 'Create User')}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="Enter first name"
              className={errors.firstName ? 'border-red-500' : ''}
              disabled={readOnly}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Enter last name"
              className={errors.lastName ? 'border-red-500' : ''}
              disabled={readOnly}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter email address"
              className={errors.email ? 'border-red-500' : ''}
              disabled={readOnly}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title
            </label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter job title"
              disabled={readOnly}
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <Input
              id="department"
              {...register('department')}
              placeholder="Enter department"
              disabled={readOnly}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Enter phone number"
              disabled={readOnly}
            />
          </div>

          {/* Reporting Manager */}
          <div>
            <label htmlFor="managerId" className="block text-sm font-medium text-gray-700 mb-2">
              Reporting Manager
            </label>
            <select
              id="managerId"
              {...register('managerId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={readOnly}
            >
              <option value="">Select a reporting manager</option>
              {users
                .filter((u: User) => u.id !== user?.id) // Exclude self
                .map((u: User) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName} ({u.email})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Team Assignments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Memberships
          </label>
          
          {/* Selected Teams */}
          {selectedTeams.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Teams:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTeams.map(teamId => {
                  const team = teams.find((t: Team) => t.id === teamId);
                  return team ? (
                    <div
                      key={teamId}
                      className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      <Users className="h-4 w-4" />
                      <span>{team.name}</span>
                      <button
                        type="button"
                        onClick={() => handleTeamToggle(teamId)}
                        className="text-blue-600 hover:text-blue-800"
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
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
            {teams.map((team: Team) => (
              <div
                key={team.id}
                className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                  selectedTeams.includes(team.id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{team.name}</div>
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={readOnly}
                >
                  {selectedTeams.includes(team.id) ? 'Remove' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Project Assignments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Assignments
          </label>
          
          {/* Current Project Assignments */}
          {projectAssignments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Assignments:</h4>
              <div className="space-y-2">
                {projectAssignments.map(assignment => {
                  const project = projects.find((p: Project) => p.id === assignment.projectId);
                  const reportingTo = users.find((u: User) => u.id === assignment.reportingToId);
                  
                  return project ? (
                    <div
                      key={assignment.projectId}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                          <Briefcase className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{project.name} ({project.code})</div>
                          <div className="text-sm text-gray-500">
                            Role: {assignment.role || 'member'}
                            {reportingTo && ` • Reports to: ${reportingTo.displayName}`}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProjectAssignment(assignment.projectId)}
                        className="text-red-600 hover:text-red-800"
                        disabled={readOnly}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Add New Project Assignment */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Project Assignment:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  onChange={(e) => {
                    const projectId = e.target.value;
                    if (projectId && !projectAssignments.find(p => p.projectId === projectId)) {
                      handleProjectAssignment(projectId);
                    }
                  }}
                  disabled={readOnly}
                >
                  <option value="">Select project</option>
                  {projects
                    .filter((p: Project) => !projectAssignments.find(pa => pa.projectId === p.id))
                    .map((project: Project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.code})
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  onChange={(e) => {
                    const projectId = projectAssignments[projectAssignments.length - 1]?.projectId;
                    if (projectId) {
                      handleProjectAssignment(projectId, undefined, e.target.value);
                    }
                  }}
                  disabled={readOnly}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reports to (Project)</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  onChange={(e) => {
                    const projectId = projectAssignments[projectAssignments.length - 1]?.projectId;
                    if (projectId) {
                      handleProjectAssignment(projectId, e.target.value || undefined);
                    }
                  }}
                  disabled={readOnly}
                >
                  <option value="">Select reporting manager</option>
                  {users
                    .filter((u: User) => u.id !== user?.id)
                    .map((u: User) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <User className="h-4 w-4" />
              )}
              {user ? 'Update User' : 'Create User'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
} 