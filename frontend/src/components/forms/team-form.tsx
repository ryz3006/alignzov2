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
import { Users, Crown, X } from 'lucide-react';

const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name must be less than 100 characters'),
  description: z.string().optional(),
  leaderId: z.string().min(1, 'Team leader is required'),
  memberIds: z.array(z.string()).optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  title?: string;
  department?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  members: Array<{
    id: string;
    user: User;
    role: string;
  }>;
}

interface TeamFormProps {
  team?: Team;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TeamForm({ team, isOpen, onClose, onSuccess }: TeamFormProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      description: '',
      leaderId: '',
      memberIds: [],
    },
  });

  // Fetch users for leader and member selection
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

  // Create/Update team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      const response = await apiCall('/api/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create team');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Team created successfully');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      const response = await apiCall(`/api/teams/${team?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update team');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Team updated successfully');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Initialize form when team data is available
  useEffect(() => {
    if (team) {
      setValue('name', team.name);
      setValue('description', team.description || '');
      setValue('leaderId', team.leaderId);
      setSelectedMembers(team.members.map(m => m.user.id));
    } else {
      reset();
      setSelectedMembers([]);
    }
  }, [team, setValue, reset]);

  const onSubmit = (data: TeamFormData) => {
    const formData = {
      ...data,
      memberIds: selectedMembers,
    };

    if (team) {
      updateTeamMutation.mutate(formData);
    } else {
      createTeamMutation.mutate(formData);
    }
  };

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter((user: User) =>
    (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const watchedLeaderId = watch('leaderId');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={team ? 'Edit Team' : 'Create Team'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Team Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Team Name *
          </label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter team name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
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
            placeholder="Enter team description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Team Leader */}
        <div>
          <label htmlFor="leaderId" className="block text-sm font-medium text-gray-700 mb-2">
            Team Leader *
          </label>
          <select
            id="leaderId"
            {...register('leaderId')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.leaderId ? 'border-red-500' : ''
            }`}
          >
            <option value="">Select a team leader</option>
            {users.map((user: User) => (
              <option key={user.id} value={user.id}>
                {user.displayName || `${user.firstName} ${user.lastName}`} ({user.email})
              </option>
            ))}
          </select>
          {errors.leaderId && (
            <p className="mt-1 text-sm text-red-600">{errors.leaderId.message}</p>
          )}
        </div>

        {/* Team Members */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Members
          </label>
          
          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Members:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(memberId => {
                  const user = users.find((u: User) => u.id === memberId);
                  return user ? (
                    <div
                      key={memberId}
                      className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      <Users className="h-4 w-4" />
                      <span>{user.displayName || `${user.firstName} ${user.lastName}`}</span>
                      <button
                        type="button"
                        onClick={() => handleMemberToggle(memberId)}
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

          {/* Available Users */}
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {filteredUsers
              .filter((user: User) => user.id !== watchedLeaderId) // Exclude leader from member list
              .map((user: User) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                    selectedMembers.includes(user.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div>
                                          <div className="font-medium text-gray-900">{user.displayName || `${user.firstName} ${user.lastName}`}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                      {user.title && (
                        <div className="text-xs text-gray-400">{user.title}</div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMemberToggle(user.id)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      selectedMembers.includes(user.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedMembers.includes(user.id) ? 'Remove' : 'Add'}
                  </button>
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
              <Crown className="h-4 w-4" />
            )}
            {team ? 'Update Team' : 'Create Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
} 