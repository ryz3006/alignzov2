'use client';

import { Modal } from '@/components/ui/modal';
import { Users, Building, Briefcase, Mail, Phone, User } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string;
  title?: string;
  department?: string;
  phone?: string;
  managerId?: string;
  manager?: {
    id: string;
    displayName: string;
  };
  teamMembers?: Array<{
    id: string;
    team: {
      id: string;
      name: string;
      description?: string;
    };
    role: string;
  }>;
  projectMembers?: Array<{
    id: string;
    projectId?: string;
    role: string;
    reportingToId?: string;
    project: {
      id: string;
      name: string;
      code: string;
    };
    reportingTo?: {
      id: string;
      firstName?: string;
      lastName?: string;
      displayName?: string;
    };
  }>;
}

interface UserViewModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserViewModal({ user, isOpen, onClose }: UserViewModalProps) {
  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`View User: ${user.firstName} ${user.lastName}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              {user.firstName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              {user.lastName}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              {user.email}
            </div>
          </div>

          {user.title && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {user.title}
              </div>
            </div>
          )}

          {user.department && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {user.department}
              </div>
            </div>
          )}

          {user.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                {user.phone}
              </div>
            </div>
          )}

          {user.manager && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reporting Manager
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                {user.manager.displayName}
              </div>
            </div>
          )}
        </div>

        {/* Team Memberships */}
        {user.teamMembers && user.teamMembers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Memberships
            </label>
            <div className="space-y-2">
              {user.teamMembers.map(teamMember => (
                <div
                  key={teamMember.id}
                  className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md"
                >
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{teamMember.team.name}</div>
                    <div className="text-sm text-gray-500">Role: {teamMember.role}</div>
                    {teamMember.team.description && (
                      <div className="text-xs text-gray-400">{teamMember.team.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Assignments */}
        {user.projectMembers && user.projectMembers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Assignments
            </label>
            <div className="space-y-2">
              {user.projectMembers.map(projectMember => (
                <div
                  key={projectMember.id}
                  className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md"
                >
                  <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {projectMember.project.name} ({projectMember.project.code})
                    </div>
                    <div className="text-sm text-gray-500">
                      Role: {projectMember.role}
                      {projectMember.reportingTo && (
                        <span> • Reports to: {projectMember.reportingTo.displayName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
} 