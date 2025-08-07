'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SettingsPageGuard } from '@/components/auth/page-permission-guard';
import { OrganizationForm } from '@/components/forms/organization-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Building2 } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

interface Organization {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    teams: number;
    projects: number;
  };
}

export default function OrganizationsPage() {
  return (
    <SettingsPageGuard>
      <OrganizationsPageContent />
    </SettingsPageGuard>
  );
}

function OrganizationsPageContent() {
  const { apiCall } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await apiCall('/api/organizations');

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load organizations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (organization: Organization) => {
    if (!confirm(`Are you sure you want to delete "${organization.name}"?`)) {
      return;
    }

    try {
      const response = await apiCall(`/api/organizations/${organization.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete organization');
      }

      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
      });

      fetchOrganizations();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete organization',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (organization: Organization) => {
    setEditingOrganization(organization);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingOrganization(null);
    fetchOrganizations();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOrganization(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading organizations...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage organizations and their email domain mappings.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Organization
          </Button>
        </div>

        {showForm ? (
          <OrganizationForm
            organization={editingOrganization || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizations
              </CardTitle>
              <CardDescription>
                Organizations are automatically mapped to users based on their email domain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organizations.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations</h3>
                  <p className="text-gray-500 mb-4">
                    Get started by creating your first organization.
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    Create Organization
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Teams</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {org.logo ? (
                              <img
                                src={org.logo}
                                alt={org.name}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{org.name}</div>
                              <div className="text-sm text-gray-500">
                                Created {new Date(org.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            @{org.domain}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {org._count.users}
                          </div>
                        </TableCell>
                        <TableCell>{org._count.teams}</TableCell>
                        <TableCell>{org._count.projects}</TableCell>
                        <TableCell>
                          <Badge variant={org.isActive ? 'default' : 'secondary'}>
                            {org.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(org)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(org)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 