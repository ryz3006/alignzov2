'use client';

import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Users, 
  Calendar, 
  DollarSign, 
  User,
  Building,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  code: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency: string;
  clientName?: string;
  ownerId: string;
  organizationId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  teams: Array<{
    id: string;
    team: {
      id: string;
      name: string;
      description?: string;
      leader: {
        id: string;
        displayName: string;
      };
    };
  }>;
}

interface ProjectViewModalProps {
  project?: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectViewModal({ project, isOpen, onClose }: ProjectViewModalProps) {
  if (!project) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-blue-100 text-blue-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Clock className="h-4 w-4" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-4 w-4" />;
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />;
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Project Header */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
            <p className="text-sm text-gray-500 font-mono">{project.code}</p>
            {project.description && (
              <p className="mt-2 text-sm text-gray-600">{project.description}</p>
            )}
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Priority:</span>
            <Badge className={getPriorityColor(project.priority)}>
              <div className="flex items-center space-x-1">
                {getPriorityIcon(project.priority)}
                <span>{project.priority}</span>
              </div>
            </Badge>
          </div>
        </div>

        {/* Project Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Information */}
          {project.clientName && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Client</span>
              </div>
              <p className="text-sm text-gray-900">{project.clientName}</p>
            </div>
          )}

          {/* Project Owner */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Project Owner</span>
            </div>
            <p className="text-sm text-gray-900">
              {project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : 'Not assigned'}
            </p>
            {project.owner && (
              <p className="text-xs text-gray-500">{project.owner.email}</p>
            )}
          </div>

          {/* Organization */}
          {project.organization && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Organization</span>
              </div>
              <p className="text-sm text-gray-900">{project.organization.name}</p>
            </div>
          )}

          {/* Budget */}
          {project.budget && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Budget</span>
              </div>
              <p className="text-sm text-gray-900">
                {project.currency} {project.budget.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        {(project.startDate || project.endDate) && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Timeline</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.startDate && (
                <div>
                  <span className="text-xs text-gray-500">Start Date</span>
                  <p className="text-sm text-gray-900">
                    {new Date(project.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {project.endDate && (
                <div>
                  <span className="text-xs text-gray-500">End Date</span>
                  <p className="text-sm text-gray-900">
                    {new Date(project.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

                 {/* Assigned Teams */}
         {project.teams && project.teams.length > 0 && (
           <div className="space-y-3">
             <div className="flex items-center space-x-2">
               <Users className="h-4 w-4 text-gray-400" />
               <span className="text-sm font-medium text-gray-700">Assigned Teams</span>
             </div>
             <div className="space-y-2">
               {project.teams.map(({ team }) => (
                 <div
                   key={team.id}
                   className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                 >
                   <div className="flex items-center space-x-3">
                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                       <Users className="h-4 w-4 text-blue-600" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-gray-900">{team.name}</p>
                       {team.description && (
                         <p className="text-xs text-gray-500">{team.description}</p>
                       )}
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-gray-500">Lead</p>
                     <p className="text-sm text-gray-900">{team.leader?.displayName || 'Not assigned'}</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         )}

        {/* Project Metadata */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span>Created:</span>
              <span className="ml-1">{new Date(project.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span>Last Updated:</span>
              <span className="ml-1">{new Date(project.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
} 