import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async checkUserPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    // Check direct user permissions
    const userPermission = await this.prisma.userPermission.findFirst({
      where: {
        userId,
        permission: {
          resource,
          action,
        },
        isActive: true,
      },
    });

    if (userPermission) {
      return true;
    }

    // Check role-based permissions
    const rolePermission = await this.prisma.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: {
          isActive: true,
          rolePermissions: {
            some: {
              permission: {
                resource,
                action,
              },
            },
          },
        },
      },
    });

    return !!rolePermission;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    // Admin roles implicitly grant all permissions
    const isAdmin = await this.prisma.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
      },
      select: { id: true },
    });
    if (isAdmin) {
      const allPermissions = await this.prisma.permission.findMany({
        select: { resource: true, action: true },
      });
      return allPermissions.map((p) => `${p.resource}.${p.action}`);
    }

    const userPermissions = await this.prisma.userPermission.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        permission: true,
      },
    });

    const rolePermissions = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        role: {
          isActive: true,
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();

    // Add direct user permissions
    userPermissions.forEach((up) => {
      permissions.add(`${up.permission.resource}.${up.permission.action}`);
    });

    // Add role-based permissions
    rolePermissions.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissions.add(`${rp.permission.resource}.${rp.permission.action}`);
      });
    });

    return Array.from(permissions);
  }

  async getUserPermissionsByResource(
    userId: string,
    resource: string,
  ): Promise<string[]> {
    // Admin roles implicitly grant all permissions for the resource
    const isAdmin = await this.prisma.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
      },
      select: { id: true },
    });
    if (isAdmin) {
      const allPermissions = await this.prisma.permission.findMany({
        where: { resource },
        select: { resource: true, action: true },
      });
      return allPermissions.map((p) => `${p.resource}.${p.action}`);
    }

    const userPermissions = await this.prisma.userPermission.findMany({
      where: {
        userId,
        isActive: true,
        permission: {
          resource,
        },
      },
      include: {
        permission: true,
      },
    });

    const rolePermissions = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        role: {
          isActive: true,
          rolePermissions: {
            some: {
              permission: {
                resource,
              },
            },
          },
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: {
                permission: {
                  resource,
                },
              },
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();

    // Add direct user permissions
    userPermissions.forEach((up) => {
      permissions.add(`${up.permission.resource}.${up.permission.action}`);
    });

    // Add role-based permissions
    rolePermissions.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissions.add(`${rp.permission.resource}.${rp.permission.action}`);
      });
    });

    return Array.from(permissions);
  }

  async filterUsersByPermission(
    users: any[],
    requestingUserId: string,
    resource: string,
    action: string,
  ): Promise<any[]> {
    const hasPermission = await this.checkUserPermission(
      requestingUserId,
      resource,
      action,
    );
    if (!hasPermission) return [];

    const scope = await this.getUserAccessScope(requestingUserId);

    // If full access, restrict to same organization only
    if (scope.fullAccess) {
      const requester = await this.prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { organizationId: true },
      });
      if (!requester?.organizationId)
        return users.filter((u) => u.id === requestingUserId);
      return users.filter((u) => u.organizationId === requester.organizationId);
    }

    const allowedUserIds = new Set<string>();

    // INDIVIDUAL: self
    if (scope.individual) {
      allowedUserIds.add(requestingUserId);
    }

    // TEAM: all members in any team the requester belongs to
    if (scope.team) {
      const myTeams = await this.prisma.teamMember.findMany({
        where: { userId: requestingUserId, isActive: true },
        select: { teamId: true },
      });
      if (myTeams.length > 0) {
        const teamIds = myTeams.map((t) => t.teamId);
        const teammates = await this.prisma.teamMember.findMany({
          where: { teamId: { in: teamIds }, isActive: true },
          select: { userId: true },
        });
        teammates.forEach((t) => allowedUserIds.add(t.userId));
      }
    }

    // PROJECT: all members in any project the requester belongs to
    if (scope.project) {
      const myProjects = await this.prisma.projectMember.findMany({
        where: { userId: requestingUserId, isActive: true },
        select: { projectId: true },
      });
      if (myProjects.length > 0) {
        const projectIds = myProjects.map((p) => p.projectId);
        const projectMates = await this.prisma.projectMember.findMany({
          where: { projectId: { in: projectIds }, isActive: true },
          select: { userId: true },
        });
        projectMates.forEach((p) => allowedUserIds.add(p.userId));
      }
    }

    return users.filter((u) => allowedUserIds.has(u.id));
  }

  async canUserAccessUser(
    requestingUserId: string,
    targetUserId: string,
    action: string,
  ): Promise<boolean> {
    // Check if user has the specific action permission
    const hasActionPermission = await this.checkUserPermission(
      requestingUserId,
      'users',
      action,
    );
    if (!hasActionPermission) return false;

    // Apply access level scoping
    const scope = await this.getUserAccessScope(requestingUserId);
    if (scope.fullAccess) return true;

    // INDIVIDUAL: can access self
    if (scope.individual && requestingUserId === targetUserId) return true;

    // TEAM: can access users who share any active team
    if (scope.team) {
      const sharedTeam = await this.prisma.teamMember.findFirst({
        where: {
          isActive: true,
          userId: requestingUserId,
          team: {
            members: {
              some: { userId: targetUserId, isActive: true },
            },
          },
        },
        select: { id: true },
      });
      if (sharedTeam) return true;
    }

    // PROJECT: can access users who share any active project
    if (scope.project) {
      const sharedProject = await this.prisma.projectMember.findFirst({
        where: {
          isActive: true,
          userId: requestingUserId,
          project: {
            members: {
              some: { userId: targetUserId, isActive: true },
            },
          },
        },
        select: { id: true },
      });
      if (sharedProject) return true;
    }

    // Otherwise, denied
    return false;
  }

  // Compute the requester's access scope from roles and explicit user access levels
  async getUserAccessScope(userId: string): Promise<{
    fullAccess: boolean;
    project: boolean;
    team: boolean;
    individual: boolean;
  }> {
    // Admin roles implicitly grant FULL_ACCESS
    const adminRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
      },
    });

    if (adminRole) {
      return { fullAccess: true, project: true, team: true, individual: true };
    }

    const levels = await this.prisma.userAccessLevel.findMany({
      where: { userId },
      select: { level: true },
    });

    const levelSet = new Set(levels.map((l) => l.level));

    const fullAccess = levelSet.has('FULL_ACCESS');
    const project = levelSet.has('PROJECT');
    const team = levelSet.has('TEAM') || project; // PROJECT implies TEAM visibility as well

    return {
      fullAccess,
      project,
      team,
      // Always include individual visibility so users can see their own data
      individual: true,
    };
  }
}
