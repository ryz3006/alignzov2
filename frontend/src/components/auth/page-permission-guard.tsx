'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/lib/permissions';
import { useAuth } from '@/lib/auth-context';

interface PagePermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: Array<{ resource: string; action: string }>;
  fallback?: React.ReactNode;
}

export function PagePermissionGuard({ 
  children, 
  requiredPermissions = [], 
  fallback 
}: PagePermissionGuardProps) {
  const { user } = useAuth();
  const { hasAnyPermission, isLoading } = usePermissions();
  const router = useRouter();

  // Check if user has any of the required permissions
  const hasAccess = requiredPermissions.length === 0 || hasAnyPermission(requiredPermissions);

  // Handle redirection for unauthorized access
  useEffect(() => {
    if (!isLoading && !hasAccess && requiredPermissions.length > 0) {
      router.push('/unauthorized');
    }
  }, [hasAccess, isLoading, router, requiredPermissions.length]);

  // Show loading state while permissions are being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If no permissions required, allow access
  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Show fallback or nothing while redirecting
  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  // User has access, render the children
  return <>{children}</>;
}

// Convenience components for common permission checks
export function UsersPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'users', action: 'read' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function RolesPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'roles', action: 'read' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function ProjectsPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'projects', action: 'read' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function TimeTrackingPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'time_sessions', action: 'read' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

// Time Sessions specific permission guards
export function TimeSessionsCreatePermissionGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'time_sessions', action: 'create' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function TimeSessionsUpdatePermissionGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'time_sessions', action: 'update' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function TimeSessionsDeletePermissionGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'time_sessions', action: 'delete' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function TimeSessionsExportPermissionGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'time_sessions', action: 'read' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function TimeSessionsBulkActionsPermissionGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'time_sessions', action: 'update' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function WorkLogsPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'work_logs', action: 'read' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function TeamsPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'teams', action: 'read' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function AnalyticsPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'analytics', action: 'read' }]}
    >
      {children}
    </PagePermissionGuard>
  );
}

export function SettingsPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <PagePermissionGuard
      requiredPermissions={[{ resource: 'settings', action: 'read' }]}
    >
      {children}
    </PagePermissionGuard>
  );
} 