import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions required, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // Check roles first
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = await this.checkUserRoles(user.id, requiredRoles);
      if (hasRequiredRole) {
        return true;
      }
    }

    // Check permissions if roles check failed or no roles required
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermissions = await this.checkUserPermissions(user.id, requiredPermissions);
      return hasRequiredPermissions;
    }

    return false;
  }

  private async checkUserRoles(userId: string, requiredRoles: string[]): Promise<boolean> {
    // Get user's roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { 
        userId,
        isActive: true,
        role: {
          isActive: true,
        },
      },
      include: {
        role: true,
      },
    });

    const userRoleNames = userRoles.map(ur => ur.role.name);
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => userRoleNames.includes(role));
    
    return hasRequiredRole;
  }

  private async checkUserPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    // Get user's permissions from roles
    const userRolePermissions = await this.prisma.userRole.findMany({
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

    // Get user's direct permissions
    const userDirectPermissions = await this.prisma.userPermission.findMany({
      where: { 
        userId,
        isActive: true,
      },
      include: {
        permission: true,
      },
    });

    // Collect all permission names
    const rolePermissionNames = userRolePermissions
      .flatMap(ur => ur.role.rolePermissions)
      .map(rp => rp.permission.name);

    const directPermissionNames = userDirectPermissions
      .map(up => up.permission.name);

    const allPermissionNames = [...rolePermissionNames, ...directPermissionNames];

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission => {
      const hasPermission = allPermissionNames.includes(permission);
      return hasPermission;
    });

    return hasAllPermissions;
  }
} 