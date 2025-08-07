import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const { permissions, ...roleData } = createRoleDto;

    const role = await this.prisma.role.create({
      data: roleData,
    });

    if (permissions && permissions.length > 0) {
      await this.assignPermissionsToRole(role.id, permissions);
    }

    return this.findOne(role.id, true);
  }

  async findAll(includePermissions = false) {
    return this.prisma.role.findMany({
      where: { isActive: true },
      include: includePermissions ? {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, includePermissions = false) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: includePermissions ? {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      } : undefined,
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { permissions, ...roleData } = updateRoleDto;

    // Check if role exists and is not a system role
    const existingRole = await this.findOne(id);
    if (existingRole.isSystem && roleData.isSystem === false) {
      throw new BadRequestException('Cannot modify system roles');
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: roleData,
    });

    if (permissions !== undefined) {
      // Remove all existing permissions
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Assign new permissions
      if (permissions.length > 0) {
        await this.assignPermissionsToRole(id, permissions);
      }
    }

    return this.findOne(id, true);
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    
    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles');
    }

    // Check if role is assigned to any users
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId: id },
    });

    if (userRoles.length > 0) {
      throw new BadRequestException('Cannot delete role that is assigned to users');
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { message: 'Role deleted successfully' };
  }

  async assignPermissions(id: string, assignPermissionsDto: AssignPermissionsDto) {
    const { permissionIds } = assignPermissionsDto;

    // Verify role exists
    await this.findOne(id);

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permissions not found');
    }

    // Remove existing permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Assign new permissions
    await this.assignPermissionsToRole(id, permissionIds);

    return this.getRolePermissions(id);
  }

  async getRolePermissions(id: string) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: id },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map(rp => rp.permission);
  }

  private async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const rolePermissions = permissionIds.map(permissionId => ({
      roleId,
      permissionId,
    }));

    await this.prisma.rolePermission.createMany({
      data: rolePermissions,
      skipDuplicates: true,
    });
  }
} 