'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  FolderOpen,
  Clock,
  TrendingUp,
  Calendar,
  Activity,
  Plus,
  ArrowUpRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Total Users',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Active Projects',
      value: '45',
      change: '+8%',
      changeType: 'positive',
      icon: FolderOpen,
    },
    {
      name: 'Hours Tracked',
      value: '2,847',
      change: '+15%',
      changeType: 'positive',
      icon: Clock,
    },
    {
      name: 'Productivity Score',
      value: '87%',
      change: '+3%',
      changeType: 'positive',
      icon: TrendingUp,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      user: 'John Doe',
      action: 'started tracking time on',
      project: 'Website Redesign',
      time: '2 minutes ago',
    },
    {
      id: 2,
      user: 'Jane Smith',
      action: 'completed work log for',
      project: 'Mobile App Development',
      time: '15 minutes ago',
    },
    {
      id: 3,
      user: 'Mike Johnson',
      action: 'joined project',
      project: 'Data Migration',
      time: '1 hour ago',
    },
    {
      id: 4,
      user: 'Sarah Wilson',
      action: 'updated project status for',
      project: 'API Integration',
      time: '2 hours ago',
    },
  ];

  const quickActions = [
    {
      name: 'Start Timer',
      description: 'Begin tracking time on current task',
      icon: Clock,
      href: '/dashboard/time-tracking',
      color: 'bg-blue-500',
    },
    {
      name: 'Create Project',
      description: 'Set up a new project',
      icon: Plus,
      href: '/dashboard/projects/new',
      color: 'bg-green-500',
    },
    {
      name: 'Add Work Log',
      description: 'Log completed work',
      icon: Activity,
      href: '/dashboard/work-logs/new',
      color: 'bg-purple-500',
    },
    {
      name: 'View Analytics',
      description: 'Check performance metrics',
      icon: TrendingUp,
      href: '/dashboard/analytics',
      color: 'bg-orange-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your team today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <ArrowUpRight className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          <span className="sr-only">Increased by</span>
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activity
              </h3>
              <div className="mt-5 flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivity.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                              <Users className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                <span className="font-medium text-gray-900">
                                  {activity.user}
                                </span>{' '}
                                {activity.action}{' '}
                                <span className="font-medium text-gray-900">
                                  {activity.project}
                                </span>
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <a
                    key={action.name}
                    href={action.href}
                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div>
                      <span
                        className={`rounded-lg inline-flex p-3 ${action.color} ring-4 ring-white`}
                      >
                        <action.icon className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-medium">
                        <span className="absolute inset-0" aria-hidden="true" />
                        {action.name}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                    <span
                      className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                      aria-hidden="true"
                    >
                      <ArrowUpRight className="h-6 w-6" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Today's Schedule
            </h3>
            <div className="mt-5">
              <div className="flex items-center justify-center h-32 text-gray-500">
                <Calendar className="h-8 w-8 mr-2" />
                <span>No scheduled meetings today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 