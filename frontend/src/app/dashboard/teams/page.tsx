'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/lib/permissions';
import { TeamForm } from '@/components/forms/team-form';
import { TeamsPageGuard } from '@/components/auth/page-permission-guard';
import { SmartActionButton } from '@/components/auth/smart-action-button';
import { Button, Input, Card, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '@/components/ui';
import { 
  TeamsPermissionGuard, 
  TeamsCreatePermissionGuard, 
  TeamsUpdatePermissionGuard, 
  TeamsDeletePermissionGuard,
  TeamsExportPermissionGuard,
  TeamsBulkActionsPermissionGuard
} from '@/components/auth/permission-guard';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Crown,
  Eye,
  Download,
  Settings,
  AlertTriangle,
  Users2,
  FolderOpen,
  Clock,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TeamData {
  id: string;
  name: string;
  description?: string;
  leader: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
  };
  members: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      displayName: string;
      email: string;
    };
    role: string;
    joinedAt: string;
  }>;
  projects: Array<{
    id: string;
    project: {
      id: string;
      name: string;
      code: string;
      status: string;
    };
  }>;
  _count: {
    members: number;
    projects: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  title?: string;
  department?: string;
}

export default function TeamsPage() {
  return (
    <TeamsPageGuard>
      <TeamsPageContent />
    </TeamsPageGuard>
  );
}

function TeamsPageContent() {
  const { apiCall } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [leaderFilter, setLeaderFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch teams
  const { data: teams = [], isLoading, error } = useQuery({
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

  // Fetch users for leader filter
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

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await apiCall(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete team');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting team:', error);
      const errorMessage = error.message || 'Failed to delete team';
      
      // Handle specific business logic errors
      if (errorMessage.includes('active members')) {
        toast.error('Cannot delete team with active members. Please remove all team members first (leader can remain).');
      } else if (errorMessage.includes('active projects')) {
        toast.error('Cannot delete team with active projects. Please reassign or remove projects first.');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  // Bulk delete teams mutation
  const bulkDeleteTeamsMutation = useMutation({
    mutationFn: async (teamIds: string[]) => {
      // Note: This would need a bulk delete endpoint in the backend
      const results = await Promise.allSettled(
        teamIds.map(async (teamId) => {
          const response = await apiCall(`/api/teams/${teamId}`, { method: 'DELETE' });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete team');
          }
          return response;
        })
      );
      
      // Check if any deletions failed
      const failedDeletions = results.filter(result => result.status === 'rejected');
      if (failedDeletions.length > 0) {
        throw new Error(`${failedDeletions.length} teams could not be deleted`);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success(`${selectedTeams.length} teams deleted successfully`);
      setSelectedTeams([]);
      setShowBulkActions(false);
    },
    onError: (error: any) => {
      console.error('Error deleting teams:', error);
      const errorMessage = error.message || 'Failed to delete some teams';
      
      if (errorMessage.includes('active members')) {
        toast.error('Some teams cannot be deleted because they have active members. Please remove all team members first (leader can remain).');
      } else if (errorMessage.includes('active projects')) {
        toast.error('Some teams cannot be deleted because they have active projects. Please reassign or remove projects first.');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  // Filter teams based on search and filters
  const filteredTeams = teams.filter((team: TeamData) => {
    const matchesSearch = (team.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (team.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (team.leader?.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesLeader = leaderFilter === 'all' || team.leader?.id === leaderFilter;
    
    return matchesSearch && matchesLeader;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PLANNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ON_HOLD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    const team = teams.find((t: TeamData) => t.id === teamId);
    const hasOtherMembers = team?._count?.members > 1; // More than just the leader
    const hasProjects = team?._count?.projects > 0;
    
    let confirmMessage = 'Are you sure you want to delete this team?';
    if (hasOtherMembers || hasProjects) {
      confirmMessage += '\n\nNote: Teams with active members or projects cannot be deleted.';
      if (hasOtherMembers) {
        confirmMessage += '\n• Remove all team members first (leader can remain)';
      }
      if (hasProjects) {
        confirmMessage += '\n• Reassign or remove associated projects first';
      }
    }
    
    if (confirm(confirmMessage)) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTeams.length === 0) {
      toast.error('No teams selected for deletion');
      return;
    }
    
    // Check if any selected teams have members or projects
    const teamsWithConstraints = selectedTeams.map(teamId => {
      const team = teams.find((t: TeamData) => t.id === teamId);
      return {
        id: teamId,
        name: team?.name || 'Unknown Team',
        hasOtherMembers: team?._count?.members > 1, // More than just the leader
        hasProjects: team?._count?.projects > 0
      };
    });
    
    const teamsWithIssues = teamsWithConstraints.filter(t => t.hasOtherMembers || t.hasProjects);
    
    let confirmMessage = `Are you sure you want to delete ${selectedTeams.length} teams?`;
    if (teamsWithIssues.length > 0) {
      confirmMessage += '\n\nNote: Some teams cannot be deleted due to constraints:';
      teamsWithIssues.forEach(team => {
        if (team.hasOtherMembers) {
          confirmMessage += `\n• "${team.name}" has active members`;
        }
        if (team.hasProjects) {
          confirmMessage += `\n• "${team.name}" has active projects`;
        }
      });
      confirmMessage += '\n\nThese teams will be skipped during deletion.';
    }
    
    if (confirm(confirmMessage)) {
      bulkDeleteTeamsMutation.mutate(selectedTeams);
    }
  };

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setIsFormOpen(true);
  };

  const handleEditTeam = (team: TeamData) => {
    setSelectedTeam(team);
    setIsFormOpen(true);
  };

  const handleViewTeam = (team: TeamData) => {
    setSelectedTeam(team);
    setIsViewModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedTeam(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedTeam(null);
  };

  const handleExportTeams = () => {
    // Enhanced export functionality with permission check
    if (!hasPermission('teams', 'read')) {
      toast.error('You do not have permission to export teams');
      return;
    }
    
    // Implement export functionality
    const csvContent = generateCSV(filteredTeams);
    downloadCSV(csvContent, 'teams-export.csv');
    toast.success('Teams exported successfully');
  };

  const generateCSV = (teams: TeamData[]) => {
    const headers = ['Team Name', 'Description', 'Leader', 'Members', 'Projects', 'Created'];
    const rows = teams.map(team => [
      team.name,
      team.description || '',
      team.leader?.displayName || 'No leader',
      team._count?.members || 0,
      team._count?.projects || 0,
      new Date(team.createdAt).toLocaleDateString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleTeamSelection = (teamId: string, checked: boolean) => {
    if (checked) {
      setSelectedTeams(prev => [...prev, teamId]);
    } else {
      setSelectedTeams(prev => prev.filter(id => id !== teamId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeams(filteredTeams.map((team: TeamData) => team.id));
    } else {
      setSelectedTeams([]);
    }
  };

  // Get unique leaders for the filter dropdown
  const uniqueLeaders = teams.reduce((leaders: Array<{id: string, displayName: string}>, team: TeamData) => {
    if (team.leader?.id && !leaders.find(l => l.id === team.leader?.id)) {
      leaders.push({
        id: team.leader.id,
        displayName: team.leader.displayName || 'Unknown Leader'
      });
    }
    return leaders;
  }, []);

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load teams</h3>
            <p className="text-gray-500 mb-4">There was an error loading the teams data.</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TeamsPermissionGuard>
        <div className="space-y-6">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your teams and team members.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <TeamsExportPermissionGuard>
                <Button onClick={handleExportTeams} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </TeamsExportPermissionGuard>
              <TeamsCreatePermissionGuard>
                <Button onClick={handleCreateTeam} variant="primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </TeamsCreatePermissionGuard>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Teams</p>
                    <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Members</p>
                                         <p className="text-2xl font-bold text-gray-900">
                       {teams.reduce((total: number, team: TeamData) => total + (team._count?.members || 0), 0)}
                     </p>
                  </div>
                  <Users2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Projects</p>
                                         <p className="text-2xl font-bold text-gray-900">
                       {teams.reduce((total: number, team: TeamData) => total + (team._count?.projects || 0), 0)}
                     </p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Team Size</p>
                                         <p className="text-2xl font-bold text-gray-900">
                       {teams.length > 0 
                         ? Math.round(teams.reduce((total: number, team: TeamData) => total + (team._count?.members || 0), 0) / teams.length)
                         : 0
                       }
                     </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          {selectedTeams.length > 0 && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected
                    </span>
                    <TeamsBulkActionsPermissionGuard>
                      <Button
                        onClick={handleBulkDelete}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </TeamsBulkActionsPermissionGuard>
                  </div>
                  <Button
                    onClick={() => setSelectedTeams([])}
                    variant="ghost"
                    size="sm"
                  >
                    Clear Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Search */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search teams..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Leader Filter */}
                <div>
                  <label htmlFor="leader" className="block text-sm font-medium text-gray-700 mb-1">
                    Team Leader
                  </label>
                  <select
                    id="leader"
                    value={leaderFilter}
                    onChange={(e) => setLeaderFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                                        <option value="all">All Leaders</option>
                    {uniqueLeaders.map((leader: {id: string, displayName: string}) => (
                      <option key={leader.id} value={leader.id}>
                        {leader.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teams Table */}
          <Card>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={selectedTeams.length === filteredTeams.length && filteredTeams.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                                         {filteredTeams.map((team: TeamData) => (
                      <TableRow key={team.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTeams.includes(team.id)}
                            onChange={(e) => handleTeamSelection(team.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{team.name}</div>
                            {team.description && (
                              <div className="text-sm text-gray-500">{team.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Crown className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">{team.leader?.displayName || 'No leader'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users2 className="h-4 w-4 text-gray-400" />
                            <span>{team._count?.members || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-gray-400" />
                            <span>{team._count?.projects || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {formatDate(team.createdAt)}
                          </span>
                        </TableCell>
                                                 <TableCell>
                           <div className="flex items-center space-x-2">
                             <SmartActionButton
                               resource="teams"
                               onEdit={() => handleEditTeam(team)}
                               onView={() => handleViewTeam(team)}
                               variant="ghost"
                               size="sm"
                             />
                             <TeamsDeletePermissionGuard>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleDeleteTeam(team.id)}
                                                                   title={
                                    team._count?.members > 1 || team._count?.projects > 0
                                      ? `Cannot delete: ${team._count?.members > 1 ? 'Has members' : ''}${team._count?.members > 1 && team._count?.projects > 0 ? ' and ' : ''}${team._count?.projects > 0 ? 'Has projects' : ''}`
                                      : "Delete Team"
                                  }
                                  disabled={team._count?.members > 1 || team._count?.projects > 0}
                                  className={
                                    team._count?.members > 1 || team._count?.projects > 0
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </TeamsDeletePermissionGuard>
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {!isLoading && filteredTeams.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || leaderFilter !== 'all' 
                      ? 'Try adjusting your search criteria'
                      : 'Get started by creating your first team'
                    }
                  </p>
                  <TeamsCreatePermissionGuard>
                    <Button className="flex items-center gap-2 mx-auto" onClick={handleCreateTeam}>
                      <Plus className="h-4 w-4" />
                      Create Team
                    </Button>
                  </TeamsCreatePermissionGuard>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Form Modal */}
        <TeamForm
          team={selectedTeam ? {
            id: selectedTeam.id,
            name: selectedTeam.name,
            description: selectedTeam.description,
            leaderId: selectedTeam.leader?.id || '',
            members: selectedTeam.members || []
          } : undefined}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />

        {/* Team View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={handleViewModalClose}
          title="Team Details"
          size="lg"
        >
          {selectedTeam && (
            <div className="space-y-6">
              {/* Team Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedTeam.name}</h3>
                {selectedTeam.description && (
                  <p className="text-gray-600">{selectedTeam.description}</p>
                )}
              </div>

              {/* Team Leader */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Team Leader</h4>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">{selectedTeam.leader?.displayName}</div>
                    <div className="text-sm text-gray-500">{selectedTeam.leader?.email}</div>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members ({selectedTeam._count?.members || 0})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTeam.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {member.user.firstName[0]}{member.user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{member.user.displayName}</div>
                          <div className="text-sm text-gray-500">{member.user.email}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        member.role === 'lead' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Projects */}
              {selectedTeam._count?.projects > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Projects ({selectedTeam._count.projects})</h4>
                  <div className="space-y-2">
                    {selectedTeam.projects?.map((projectTeam) => (
                      <div key={projectTeam.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div>
                          <div className="font-medium">{projectTeam.project.name}</div>
                          <div className="text-sm text-gray-500">{projectTeam.project.code}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(projectTeam.project.status)}`}>
                          {projectTeam.project.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedTeam._count?.members || 0}</div>
                  <div className="text-sm text-gray-500">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedTeam._count?.projects || 0}</div>
                  <div className="text-sm text-gray-500">Projects</div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </TeamsPermissionGuard>
    </DashboardLayout>
  );
} 