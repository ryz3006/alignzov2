'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SettingsPageGuard } from '@/components/auth/page-permission-guard';
import { 
  SettingsPermissionGuard,
  SettingsUpdatePermissionGuard
} from '@/components/auth/permission-guard';
import {
  Settings,
  User,
  Shield,
  Bell,
  Globe,
  Database,
  Key,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <SettingsPageGuard>
      <SettingsPageContent />
    </SettingsPageGuard>
  );
}

function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'integrations', name: 'Integrations', icon: Globe },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your account settings and preferences.
            </p>
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <SettingsPermissionGuard>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Organization Name
                        </label>
                        <SettingsUpdatePermissionGuard>
                          <input
                            type="text"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Enter organization name"
                          />
                        </SettingsUpdatePermissionGuard>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Time Zone
                        </label>
                        <SettingsUpdatePermissionGuard>
                          <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option>UTC (00:00)</option>
                            <option>EST (-05:00)</option>
                            <option>PST (-08:00)</option>
                          </select>
                        </SettingsUpdatePermissionGuard>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Date Format
                        </label>
                        <SettingsUpdatePermissionGuard>
                          <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option>MM/DD/YYYY</option>
                            <option>DD/MM/YYYY</option>
                            <option>YYYY-MM-DD</option>
                          </select>
                        </SettingsUpdatePermissionGuard>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsPermissionGuard>
            )}

            {activeTab === 'security' && (
              <SettingsPermissionGuard>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Session Timeout (minutes)
                        </label>
                        <SettingsUpdatePermissionGuard>
                          <input
                            type="number"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="30"
                          />
                        </SettingsUpdatePermissionGuard>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Password Policy
                        </label>
                        <SettingsUpdatePermissionGuard>
                          <div className="mt-2 space-y-2">
                            <label className="flex items-center">
                              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                              <span className="ml-2 text-sm text-gray-700">Require uppercase letters</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                              <span className="ml-2 text-sm text-gray-700">Require numbers</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                              <span className="ml-2 text-sm text-gray-700">Require special characters</span>
                            </label>
                          </div>
                        </SettingsUpdatePermissionGuard>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsPermissionGuard>
            )}

            {activeTab === 'notifications' && (
              <SettingsPermissionGuard>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email Notifications
                        </label>
                        <SettingsUpdatePermissionGuard>
                          <div className="mt-2 space-y-2">
                            <label className="flex items-center">
                              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                              <span className="ml-2 text-sm text-gray-700">Project updates</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                              <span className="ml-2 text-sm text-gray-700">Time tracking reminders</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                              <span className="ml-2 text-sm text-gray-700">System announcements</span>
                            </label>
                          </div>
                        </SettingsUpdatePermissionGuard>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsPermissionGuard>
            )}

            {activeTab === 'integrations' && (
              <SettingsPermissionGuard>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Integrations</h3>
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Globe className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Slack Integration</h4>
                              <p className="text-sm text-gray-500">Connect with Slack for notifications</p>
                            </div>
                          </div>
                          <SettingsUpdatePermissionGuard>
                            <button className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700">
                              Connect
                            </button>
                          </SettingsUpdatePermissionGuard>
                        </div>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Database className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Database Backup</h4>
                              <p className="text-sm text-gray-500">Configure automated backups</p>
                            </div>
                          </div>
                          <SettingsUpdatePermissionGuard>
                            <button className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700">
                              Configure
                            </button>
                          </SettingsUpdatePermissionGuard>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsPermissionGuard>
            )}

            {/* Save Button */}
            <SettingsUpdatePermissionGuard>
              <div className="mt-6 flex justify-end">
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </SettingsUpdatePermissionGuard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 