import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { DataScopeService } from '../common/services/data-scope.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const { teamIds, projectAssignments, ...userData } = createUserDto;
    const organization = await this.organizationsService.validateUserDomain(
      userData.email,
    );
    if (!organization) {
      throw new BadRequestException(
        'Cannot create user without a valid organization domain.',
      );
    }

    return this.prisma.user.create({
      data: {
        ...userData,
        organizationId: organization.id,
        emailVerifiedAt: userData.emailVerified ? new Date() : null,
        avatar: userData.avatarUrl,
      },
    });
  }

  async findAll(
    organizationId?: string,
    requestingUserId?: string,
  ): Promise<User[]> {
    if (!requestingUserId) {
      throw new NotFoundException('A requesting user ID must be provided.');
    }

    const whereScope = await this.dataScopeService.getAccessScopeWhereClause(
      requestingUserId,
      'user',
    );

    const subordinates = await this.prisma.user.findMany({
      where: { managerId: requestingUserId },
      select: { id: true },
    });
    const subordinateIds = subordinates.map((s) => s.id);

    const specialAccess: Prisma.UserWhereInput = {
      OR: [{ id: requestingUserId }, { id: { in: subordinateIds } }],
    };

    const finalWhere: Prisma.UserWhereInput = {
      OR: [whereScope, specialAccess],
    };

    if (organizationId) {
      (finalWhere.AND as Prisma.UserWhereInput[]) =
        (finalWhere.AND as Prisma.UserWhereInput[]) || [];
      (finalWhere.AND as Prisma.UserWhereInput[]).push({ organizationId });
    }

    return this.prisma.user.findMany({
      where: finalWhere,
      include: {
        manager: true,
        subordinates: true,
        accessLevels: true,
        userRoles: { include: { role: true } },
        teamMembers: { include: { team: true } },
        projectMembers: { include: { project: true, reportingTo: true } },
      },
    });
  }

  async findById(
    id: string,
    requestingUserId: string,
    options: { includeRoles?: boolean } = {},
  ): Promise<User> {
    const where = await this.dataScopeService.getAccessScopeWhereClause(
      requestingUserId,
      'user',
    );

    const finalWhere: Prisma.UserWhereInput = {
      AND: [where, { id: id }],
    };

    const include: Prisma.UserInclude = {
      manager: true,
      subordinates: true,
      accessLevels: true,
      projectMembers: { include: { project: true, reportingTo: true } },
    };

    if (options.includeRoles) {
      include.userRoles = { include: { role: true } };
    }

    const user = await this.prisma.user.findFirst({
      where: finalWhere,
      include,
    });

    if (!user) {
      throw new NotFoundException('User not found or you do not have access');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: true } },
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findById(id, id); // Use self as requesting user for permission check

    const { accessLevels, ...userData } = updateUserDto;

    return this.prisma.$transaction(async (prisma) => {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...userData,
          avatar: userData.avatarUrl,
        },
      });

      if (accessLevels) {
        await prisma.userAccessLevel.deleteMany({ where: { userId: id } });
        await prisma.userAccessLevel.createMany({
          data: accessLevels.map((level) => ({
            userId: id,
            level: level as any,
          })),
        });
      }

      return updatedUser;
    });
  }

  async remove(id: string, requestingUserId: string): Promise<User> {
    await this.findById(id, requestingUserId);
    return this.prisma.user.delete({ where: { id } });
  }

  async searchUsers(query: string, organizationId?: string) {
    const where: Prisma.UserWhereInput = {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (organizationId) {
      (where.AND as Prisma.UserWhereInput[]) =
        (where.AND as Prisma.UserWhereInput[]) || [];
      (where.AND as Prisma.UserWhereInput[]).push({ organizationId });
    }

    return this.prisma.user.findMany({ where });
  }

  async getSubordinates(userId: string) {
    return this.prisma.user.findMany({ where: { managerId: userId } });
  }

  async assignManager(userId: string, managerId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { managerId },
    });
  }

  async removeManager(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { managerId: null },
    });
  }

  async assignRole(userId: string, roleId: string) {
    return this.prisma.$transaction(async (prisma) => {
      await prisma.userRole.deleteMany({ where: { userId } });
      return prisma.userRole.create({
        data: {
          userId,
          roleId,
        },
      });
    });
  }

  async removeRole(userId: string, roleId: string) {
    return this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  }
}
