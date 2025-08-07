'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

interface OrganizationFormProps {
  organization?: {
    id: string;
    name: string;
    domain: string;
    logo?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OrganizationForm({ organization, onSuccess, onCancel }: OrganizationFormProps) {
  const { apiCall } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    domain: organization?.domain || '',
    logo: organization?.logo || '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = organization 
        ? `/api/organizations/${organization.id}`
        : '/api/organizations';
      
      const method = organization ? 'PATCH' : 'POST';
      
      const response = await apiCall(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save organization');
      }

      toast({
        title: 'Success',
        description: organization 
          ? 'Organization updated successfully' 
          : 'Organization created successfully',
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {organization ? 'Edit Organization' : 'Create Organization'}
        </CardTitle>
        <CardDescription>
          {organization 
            ? 'Update organization details' 
            : 'Create a new organization with email domain mapping'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Organization Name
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter organization name"
              required
            />
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium mb-1">
              Email Domain
            </label>
            <Input
              id="domain"
              type="text"
              value={formData.domain}
              onChange={(e) => handleInputChange('domain', e.target.value)}
              placeholder="e.g., company.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Users with this email domain will be automatically assigned to this organization
            </p>
          </div>

          <div>
            <label htmlFor="logo" className="block text-sm font-medium mb-1">
              Logo URL (Optional)
            </label>
            <Input
              id="logo"
              type="url"
              value={formData.logo}
              onChange={(e) => handleInputChange('logo', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : (organization ? 'Update' : 'Create')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 