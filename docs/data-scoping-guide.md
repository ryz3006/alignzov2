# 🌊 Data Scoping Guide

## Overview

This guide explains how data visibility is managed across the application. Unlike permission checks, which control *what actions* a user can perform, data scoping controls *which records* a user can see. The primary mechanism for this is the `DataScopeService`, which works in conjunction with user-assigned `AccessLevel`s.

## The `DataScopeService`

All data-fetching operations in backend services (e.g., `findAll`, `findOne`) that return lists of resources like work logs, projects, or users must use the `DataScopeService`. This service is responsible for constructing a Prisma `WHERE` clause that automatically filters results based on the requesting user's access scope.

**Example Usage in a Service:**

```typescript
@Injectable()
export class WorkLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  async findAll(userId: string) {
    // Get the appropriate WHERE clause for the user and resource
    const where = await this.dataScopeService.getAccessScopeWhereClause(userId, 'work-log');
    
    // Use the clause in the Prisma query
    return this.prisma.workLog.findMany({ where });
  }
}
```

This ensures that data scoping logic is centralized, consistent, and easy to maintain.

## Access Levels

Access Levels are assigned to users and determine the breadth of data they can see. A user can have multiple access levels simultaneously, and their total visibility is the sum of all their assigned levels. They are managed on the **Users -> Edit User** page.

The available levels are:

-   **`INDIVIDUAL`**: Grants access *only* to the user's own records (e.g., their own work logs, their own user profile). This is the baseline access.
-   **`TEAM`**: Grants access to all data belonging to other users who are members of the *same team(s)*.
-   **`PROJECT`**: Grants access to all data belonging to other users who are members of the *same project(s)*.
-   **`ORGANIZATION`**: Grants access to all data within the user's entire organization.
-   **`FULL_ACCESS`**: A system-level access that bypasses organizational boundaries. Reserved for Super Admins.

## Special Page-Specific Logic

For certain pages, visibility rules are expanded beyond the standard access level scopes to provide a more intuitive user experience.

-   **Users Page (`/dashboard/users`)**: In addition to the standard scope, a user can always see:
    -   Their own user profile.
    -   The profiles of any users who report directly to them (their direct subordinates).

-   **Teams Page (`/dashboard/teams`)**: In addition to the standard scope, a user can always see:
    -   Teams they lead.
    -   Teams they are a member of.

-   **Projects Page (`/dashboard/projects`)**: In addition to the standard scope, a user can always see:
    -   Projects they own.
    -   Projects they are a member of.

This special logic is implemented directly within the `findAll` methods of the `UsersService`, `TeamsService`, and `ProjectsService`, respectively, in combination with the base `WHERE` clause provided by the `DataScopeService`.

