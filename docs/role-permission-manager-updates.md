# Role-Permission Manager Updates

## Overview
Updates to the role-permission manager align it with standardized RBAC and the decision to hide the `permissions` resource from UI.

## Key Changes

- Resource list excludes `permissions` entirely (both in filters and grouped sections).
- Uses standardized `resource.action` names; no `api.` or `ui.` suffixes.
- Bulk operations work per resource (users, roles, projects, teams, time_sessions, work_logs, organizations, settings, analytics).
- Role-level operations enforced:
  - Assign permissions → requires `roles.assign_permission`
  - Unassign permissions → requires `roles.unassign_permission`

## API Usage

- Fetch permissions: `GET /api/permissions` (server excludes `resource === 'permissions'`).
- Fetch role permissions: `GET /api/roles/:id/permissions`.
- Assign: `POST /api/roles/:id/permissions` with `{ permissionIds: string[] }`.

## UI Notes

- The resource dropdown shows only active resources, excluding `permissions`.
- Group summaries reflect only visible resources.
- “Manage Permissions” UI buttons are shown/hidden based on `roles.assign_permission`. 