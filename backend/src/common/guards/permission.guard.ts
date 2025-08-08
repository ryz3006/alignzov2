import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export interface PermissionMetadata {
  resource: string;
  action: string;
}

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (resource: string, action: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PERMISSIONS_KEY, { resource, action }, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<PermissionMetadata>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has the required permission
    const hasPermission = await this.checkUserPermission(
      user.id, 
      requiredPermission.resource, 
      requiredPermission.action
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermission.resource}.${requiredPermission.action}`
      );
    }

    return true;
  }

  private async checkUserPermission(userId: string, resource: string, action: string): Promise<boolean> {
    // Admin roles have implicit allow
    const isAdmin = await this.prisma.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
      },
      select: { id: true },
    });
    if (isAdmin) return true;

    // Check direct user permissions
    const userPermission = await this.prisma.userPermission.findFirst({
      where: {
        userId,
        isActive: true,
        permission: { resource, action },
      },
      select: { id: true },
    });
    if (userPermission) return true;

    // Check role-based permissions
    const rolePermission = await this.prisma.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: {
          isActive: true,
          rolePermissions: { some: { permission: { resource, action } } },
        },
      },
      select: { id: true },
    });
    return !!rolePermission;
  }
} 