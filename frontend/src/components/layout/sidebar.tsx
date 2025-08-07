'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { usePermissions, PERMISSIONS } from '@/lib/permissions';
import {
  Home,
  Users,
  FolderOpen,
  Clock,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Key,
  Building2,
} from 'lucide-react';

// Navigation items with permission requirements
// Note: All pages now have proper permission requirements
const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    permissions: [] // Dashboard is accessible to all authenticated users
  },
  { 
    name: 'Users', 
    href: '/dashboard/users', 
    icon: Users,
    permissions: [PERMISSIONS.USERS_READ]
  },
  { 
    name: 'Projects', 
    href: '/dashboard/projects', 
    icon: FolderOpen,
    permissions: [PERMISSIONS.PROJECTS_READ]
  },
  { 
    name: 'Teams', 
    href: '/dashboard/teams', 
    icon: Users,
    permissions: [PERMISSIONS.TEAMS_READ]
  },
  { 
    name: 'Time Tracking', 
    href: '/dashboard/time-tracking', 
    icon: Clock,
    permissions: [PERMISSIONS.TIME_SESSIONS_READ]
  },
  { 
    name: 'Work Logs', 
    href: '/dashboard/work-logs', 
    icon: FileText,
    permissions: [PERMISSIONS.WORK_LOGS_READ]
  },
  { 
    name: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: BarChart3,
    permissions: [PERMISSIONS.ANALYTICS_READ]
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    permissions: [PERMISSIONS.SETTINGS_READ] // Settings requires settings read permission
  },
];

// RBAC-specific navigation items
const rbacNavigation = [
  { 
    name: 'Roles', 
    href: '/dashboard/roles', 
    icon: Shield, 
    permissions: [PERMISSIONS.ROLES_READ]
  },
  { 
    name: 'Organizations', 
    href: '/dashboard/settings/organizations', 
    icon: Building2, 
    permissions: [PERMISSIONS.ORGANIZATIONS_READ]
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasAnyPermission, isLoading, userPermissions } = usePermissions();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter navigation based on user permissions
  const visibleNavigation = navigation.filter(item => {
    // If no permissions required, show to all authenticated users
    if (item.permissions.length === 0) return true;
    
    // Check if user has any of the required permissions
    return hasAnyPermission(item.permissions);
  });

  // Filter RBAC navigation based on user permissions
  const visibleRbacItems = rbacNavigation.filter(item => 
    hasAnyPermission(item.permissions)
  );



  // Don't render navigation while permissions are loading
  if (isLoading) {
    return (
      <div className="bg-white shadow-lg w-64">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">Alignzo</span>
            </div>
          </div>
          <div className="flex-1 px-2 py-4">
            <div className="animate-pulse space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">Alignzo</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {!collapsed && item.name}
              </Link>
            );
          })}

          {/* RBAC Section */}
          {visibleRbacItems.length > 0 && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-2">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Access Control
                  </h3>
                </div>
              )}
              {visibleRbacItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {!collapsed && item.name}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            {!collapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getRoleColor(
                    user?.role || ''
                  )}`}
                >
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 