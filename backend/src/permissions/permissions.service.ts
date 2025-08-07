import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { resource, action } = createPermissionDto;

    // Check if permission already exists
    const existingPermission = await this.prisma.permission.findUnique({
      where: { resource_action: { resource, action } },
    });

    if (existingPermission) {
      throw new BadRequestException(`Permission for resource '${resource}' and action '${action}' already exists`);
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async findAll(resource?: string) {
    return this.prisma.permission.findMany({
      where: resource ? { resource } : undefined,
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.findOne(id);

    if (permission.isSystem) {
      throw new BadRequestException('Cannot modify system permissions');
    }

    const { resource, action } = updatePermissionDto;

    // Check if the new resource/action combination already exists
    if (resource && action) {
      const existingPermission = await this.prisma.permission.findUnique({
        where: { resource_action: { resource, action } },
      });

      if (existingPermission && existingPermission.id !== id) {
        throw new BadRequestException(`Permission for resource '${resource}' and action '${action}' already exists`);
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  async remove(id: string) {
    const permission = await this.findOne(id);

    if (permission.isSystem) {
      throw new BadRequestException('Cannot delete system permissions');
    }

    // Check if permission is assigned to any roles
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { permissionId: id },
    });

    if (rolePermissions.length > 0) {
      throw new BadRequestException('Cannot delete permission that is assigned to roles');
    }

    // Check if permission is assigned to any users
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { permissionId: id },
    });

    if (userPermissions.length > 0) {
      throw new BadRequestException('Cannot delete permission that is assigned to users');
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    return { message: 'Permission deleted successfully' };
  }

  async getResources() {
    const resources = await this.prisma.permission.findMany({
      select: { resource: true },
      distinct: ['resource'],
      orderBy: { resource: 'asc' },
    });

    return resources.map(r => r.resource);
  }

  async getActions() {
    const actions = await this.prisma.permission.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });

    return actions.map(a => a.action);
  }
} 