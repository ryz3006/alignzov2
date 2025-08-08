# 🔐 Access Management Guide

## Overview
This guide explains how access levels and permissions interact, what resources exist, and where assignments are managed.

## Access Levels

Supported access levels are managed by the `DataScopeService` and are multi-selectable on a per-user basis. For a detailed explanation of how data visibility is determined, see the [Data Scoping Guide](./data-scoping-guide.md).

The available levels are:
- INDIVIDUAL: access to own data
- TEAM: access to teams the user is a member/lead of
- PROJECT: access to projects the user is a member/lead of
- ORGANIZATION: access to all data within the user's organization
- FULL_ACCESS: organization-wide access

Services enforce scoping for list/detail operations based on the requester’s access level by using the centralized `DataScopeService`.

## Permission Structure

Permissions follow `resource.action`, for example:
- `users.read`, `projects.update`, `work_logs.create`, `roles.assign_permission`

No `api.` or `ui.` suffixes are used.

## Current Resources

- users, roles, projects, teams, time_sessions, work_logs, organizations, settings, analytics

Note: The `permissions` resource is not exposed in UI and should not be selected in role forms.

## Where to Assign Things

- Team membership: Managed in the Team Create/Edit modal.
- Project membership: Managed in the Project Create/Edit modal.
- User’s role and access levels: Managed in the User Create/Edit modal.

## Backend Guards

- Controllers use `@UseGuards(JwtAuthGuard, PermissionGuard)`.
- Endpoints are protected via `@RequirePermissions('<resource>', '<action>')`.

## Seed Defaults

- SUPER_ADMIN: all permissions + FULL_ACCESS
- ADMIN: read baselines for core resources

## Best Practices

- Enforce authorization on backend; frontend checks are for UX.
- Use standardized permission names end-to-end.
- Keep `permissions` resource hidden from UI; use role-level assign/unassign actions instead. 