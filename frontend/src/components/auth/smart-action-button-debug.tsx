'use client';

import { useState } from 'react';
import { SmartActionButton } from './smart-action-button';
import { usePermissions } from '@/lib/permissions';

export function SmartActionButtonDebug() {
  const { hasPermission, getPermissions, isLoading } = usePermissions();
  const [resource, setResource] = useState('users');

  const testPermissions = [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'delete' },
  ];

  const handleEdit = () => {
    console.log('Edit button clicked');
    alert('Edit action triggered');
  };

  const handleView = () => {
    console.log('View button clicked');
    alert('View action triggered');
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">SmartActionButton Debug</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Resource:</label>
          <select 
            value={resource} 
            onChange={(e) => setResource(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="users">users</option>
            <option value="roles">roles</option>
            <option value="permissions">permissions</option>
            <option value="projects">projects</option>
            <option value="teams">teams</option>
          </select>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Current Permissions:</h3>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>All Permissions:</strong></p>
            <ul className="list-disc list-inside ml-4">
              {getPermissions().map((perm, index) => (
                <li key={index}>{perm.resource}.{perm.action}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Permission Tests:</h3>
          <div className="space-y-2">
            {testPermissions.map(({ resource: testResource, action }) => (
              <div key={`${testResource}.${action}`} className="flex items-center space-x-2">
                <span className="w-24">{testResource}.{action}:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  hasPermission(testResource, action) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {hasPermission(testResource, action) ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">SmartActionButton Test:</h3>
          <div className="border p-4 rounded">
            <SmartActionButton
              resource={resource}
              onEdit={handleEdit}
              onView={handleView}
              variant="outline"
              size="md"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Expected Behavior:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>If user has <strong>update</strong> permission: Shows Edit button</li>
            <li>If user has <strong>read</strong> permission but no update: Shows View button</li>
            <li>If user has no permissions: Shows nothing</li>
            <li>If permissions are loading: Shows loading spinner</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 