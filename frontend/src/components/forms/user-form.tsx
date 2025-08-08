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
import { User } from 'lucide-react';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  managerId: z.string().optional(), // Organizational reporting manager
  accessLevels: z.array(z.string()).optional(),
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
  accessLevels?: Array<{ level: string }>;
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

// Team and Project assignments are managed via Team/Project modals, not here

interface UserFormProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  readOnly?: boolean;
}

export function UserForm({ user, isOpen, onClose, onSuccess, readOnly = false }: UserFormProps) {
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
      accessLevels: [],
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

  // Team and Project lists are not needed here

  // Create/Update user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // Do not send accessLevels in the initial create request because the backend CreateUserDto forbids it
      const { accessLevels, ...createPayload } = data as any;

      const createResponse = await apiCall('/api/users', {
        method: 'POST',
        body: JSON.stringify(createPayload),
      });
      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.message || 'Failed to create user');
      }
      const createdUser = await createResponse.json();

      // If access levels were selected, perform a follow-up PATCH to set them
      if (Array.isArray(accessLevels) && accessLevels.length > 0) {
        const patchResponse = await apiCall(`/api/users/${createdUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ accessLevels }),
        });
        if (!patchResponse.ok) {
          const patchError = await patchResponse.json();
          throw new Error(patchError.message || 'User created, but failed to set access levels');
        }
      }

      return createdUser;
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
      setValue('accessLevels', user.accessLevels?.map(al => al.level) || []);
      
    } else {
      reset();
    }
  }, [user, setValue, reset]);

  const onSubmit = (data: UserFormData) => {
    const formData: any = { ...data };
    // Normalize optional fields that cannot be empty strings
    if (formData.managerId === '') {
      delete formData.managerId;
    }
    if (Array.isArray(formData.accessLevels) && formData.accessLevels.length === 0) {
      delete formData.accessLevels;
    }
    console.log('UserForm onSubmit - formData being sent:', formData);
    if (user) {
      updateUserMutation.mutate(formData);
    } else {
      createUserMutation.mutate(formData);
    }
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

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Access Levels</label>
            <div className="grid grid-cols-2 gap-4">
                {['INDIVIDUAL', 'TEAM', 'PROJECT', 'ORGANIZATION', 'FULL_ACCESS'].map(level => (
                    <div key={level} className="flex items-center">
                        <input
                            id={level}
                            type="checkbox"
                            value={level}
                            {...register('accessLevels')}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            disabled={readOnly}
                        />
                        <label htmlFor={level} className="ml-2 block text-sm text-gray-900">{level}</label>
                    </div>
                ))}
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