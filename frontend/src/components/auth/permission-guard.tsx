'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePermissions } from '@/lib/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  resource: string;
  action: string;
  fallback?: ReactNode;
}

interface PermissionGuardButtonProps {
  children: ReactNode;
  resource: string;
  action: string;
  variant?: 'button' | 'link' | 'icon';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

// Main permission guard component
export function PermissionGuard({ children, resource, action, fallback = null }: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions();
  const canAccess = hasPermission(resource, action);

  if (isLoading) {
    return null; // or a loading spinner
  }

  return canAccess ? <>{children}</> : <>{fallback}</>;
}

// Button-specific permission guard
export function PermissionGuardButton({ 
  children, 
  resource, 
  action, 
  variant = 'button',
  className = '',
  onClick,
  disabled = false 
}: PermissionGuardButtonProps) {
  const { hasPermission, isLoading } = usePermissions();
  const canAccess = hasPermission(resource, action);

  if (isLoading || !canAccess) {
    return null;
  }

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      type={variant === 'button' ? 'button' : undefined}
    >
      {children}
    </button>
  );
}

// Specific permission guards for users
export function UsersPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="users" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UsersCreatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="users" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UsersUpdatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="users" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UsersDeletePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="users" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UsersAssignRolePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="users" action="assign_role" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UsersChangeRolePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="users" action="change_role" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UsersExportPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  // Export functionality can be handled by read permission
  return (
    <PermissionGuard resource="users" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UsersBulkActionsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  // Bulk actions can be handled by update permission
  return (
    <PermissionGuard resource="users" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Button-specific permission guards
export function UsersCreateButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="users" action="create" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function UsersEditButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="users" action="update" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function UsersDeleteButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="users" action="delete" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function UsersAssignRoleButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="users" action="assign_role" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function UsersChangeRoleButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="users" action="change_role" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function UsersExportButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="users" action="export" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function UsersViewPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="users" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UsersViewButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="users" action="read" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

// Role-related permission guards
export function RolesPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="roles" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function RolesCreatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="roles" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function RolesUpdatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="roles" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function RolesDeletePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="roles" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function RolesManagePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="roles" action="manage" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Role button-specific permission guards
export function RolesCreateButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="roles" action="create" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function RolesEditButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="roles" action="update" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function RolesDeleteButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="roles" action="delete" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function RolesManageButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="roles" action="manage" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

// Permission-related permission guards
export function PermissionsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="permissions" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function PermissionsCreatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="permissions" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function PermissionsUpdatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="permissions" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function PermissionsDeletePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="permissions" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function PermissionsManagePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="permissions" action="manage" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Legacy role guards for backward compatibility
export function AdminRoleGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="roles" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function SuperAdminRoleGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="roles" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Organization-related permission guards
export function OrganizationsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="organizations" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function OrganizationsCreatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="organizations" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function OrganizationsUpdatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="organizations" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function OrganizationsDeletePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="organizations" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Project-related permission guards
export function ProjectsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="projects" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ProjectsCreatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="projects" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ProjectsUpdatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="projects" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ProjectsDeletePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="projects" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ProjectsExportPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  // Export functionality can be handled by read permission
  return (
    <PermissionGuard resource="projects" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ProjectsBulkActionsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  // Bulk actions can be handled by update permission
  return (
    <PermissionGuard resource="projects" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Team-related permission guards
export function TeamsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="teams" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function TeamsCreatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="teams" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function TeamsUpdatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="teams" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function TeamsDeletePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="teams" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function TeamsExportPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  // Export functionality can be handled by read permission
  return (
    <PermissionGuard resource="teams" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function TeamsBulkActionsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  // Bulk actions can be handled by update permission
  return (
    <PermissionGuard resource="teams" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Time Session-related permission guards
export function TimeSessionsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="time_sessions" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function TimeSessionsCreatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="time_sessions" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function TimeSessionsUpdatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="time_sessions" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function TimeSessionsDeletePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="time_sessions" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Work Log-related permission guards
export function WorkLogsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="work_logs" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function WorkLogsCreatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="work_logs" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function WorkLogsUpdatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="work_logs" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function WorkLogsDeletePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="work_logs" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function WorkLogsExportPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  // Export functionality can be handled by read permission
  return (
    <PermissionGuard resource="work_logs" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function WorkLogsBulkActionsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  // Bulk actions can be handled by delete permission
  return (
    <PermissionGuard resource="work_logs" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Analytics-related permission guards
export function AnalyticsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="analytics" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function AnalyticsCreatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="analytics" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function AnalyticsUpdatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="analytics" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function AnalyticsDeletePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="analytics" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Settings-related permission guards
export function SettingsPermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="settings" action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function SettingsCreatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="settings" action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function SettingsUpdatePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="settings" action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function SettingsDeletePermissionGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard resource="settings" action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Button-specific permission guards for all resources
export function OrganizationsCreateButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="organizations" action="create" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function OrganizationsEditButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="organizations" action="update" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function OrganizationsDeleteButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="organizations" action="delete" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function ProjectsCreateButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="projects" action="create" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function ProjectsEditButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="projects" action="update" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function ProjectsDeleteButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="projects" action="delete" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function TeamsCreateButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="teams" action="create" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function TeamsEditButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="teams" action="update" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function TeamsDeleteButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="teams" action="delete" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function TimeSessionsCreateButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="time_sessions" action="create" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function TimeSessionsEditButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="time_sessions" action="update" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function TimeSessionsDeleteButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="time_sessions" action="delete" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function WorkLogsCreateButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="work_logs" action="create" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function WorkLogsEditButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="work_logs" action="update" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function WorkLogsDeleteButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="work_logs" action="delete" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function AnalyticsCreateButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="analytics" action="create" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function AnalyticsEditButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="analytics" action="update" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function AnalyticsDeleteButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="analytics" action="delete" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

// Settings button components
export function SettingsCreateButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="settings" action="create" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function SettingsEditButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="settings" action="update" {...props}>
      {children}
    </PermissionGuardButton>
  );
}

export function SettingsDeleteButton({ children, ...props }: Omit<PermissionGuardButtonProps, 'resource' | 'action'>) {
  return (
    <PermissionGuardButton resource="settings" action="delete" {...props}>
      {children}
    </PermissionGuardButton>
  );
}
