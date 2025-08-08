import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async checkUserPermission(userId: string, resource: string, action: string): Promise<boolean> {
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
    userPermissions.forEach(up => {
      permissions.add(`${up.permission.resource}.${up.permission.action}`);
    });

    // Add role-based permissions
    rolePermissions.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(`${rp.permission.resource}.${rp.permission.action}`);
      });
    });

    return Array.from(permissions);
  }

  async getUserPermissionsByResource(userId: string, resource: string): Promise<string[]> {
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
    userPermissions.forEach(up => {
      permissions.add(`${up.permission.resource}.${up.permission.action}`);
    });

    // Add role-based permissions
    rolePermissions.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(`${rp.permission.resource}.${rp.permission.action}`);
      });
    });

    return Array.from(permissions);
  }

  async filterUsersByPermission(users: any[], requestingUserId: string, resource: string, action: string): Promise<any[]> {
    const hasPermission = await this.checkUserPermission(requestingUserId, resource, action);
    
    if (!hasPermission) {
      return [];
    }

    // If user has permission, return all users (you can add more filtering logic here)
    return users;
  }

  async canUserAccessUser(requestingUserId: string, targetUserId: string, action: string): Promise<boolean> {
    // Check if user has the specific action permission
    const hasActionPermission = await this.checkUserPermission(requestingUserId, 'users', action);
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
  private async getUserAccessScope(userId: string): Promise<{
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

    return {
      fullAccess: levelSet.has('FULL_ACCESS'),
      project: levelSet.has('PROJECT'),
      team: levelSet.has('TEAM'),
      individual: levelSet.has('INDIVIDUAL') || levels.length === 0, // default to individual if none set
    };
  }
} 