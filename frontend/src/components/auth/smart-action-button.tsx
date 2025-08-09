'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Edit, Eye } from 'lucide-react';

interface SmartActionButtonProps {
  resource: string;
  onEdit: () => void;
  onView: () => void;
  className?: string;
  variant?: 'ghost' | 'outline' | 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function SmartActionButton({ 
  resource, 
  onEdit, 
  onView, 
  className = '',
  variant = 'ghost',
  size = 'sm'
}: SmartActionButtonProps) {
  const { hasPermission, isLoading } = usePermissions();
  
  // Check permissions using the standardized permission system
  const hasUpdatePermission = hasPermission(resource, 'update');
  const hasViewPermission = hasPermission(resource, 'read');

  if (isLoading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      </Button>
    );
  }

  // If user has update permission, show edit button
  if (hasUpdatePermission) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={className} 
        onClick={onEdit}
        title="Edit Time Entry"
      >
        <Edit className="h-4 w-4" />
      </Button>
    );
  }

  // If user has view permission but no update permission, show view button
  if (hasViewPermission) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={className} 
        onClick={onView}
        title="View Time Entry"
      >
        <Eye className="h-4 w-4" />
      </Button>
    );
  }

  // If user has no permissions, don't show anything
  return null;
} 