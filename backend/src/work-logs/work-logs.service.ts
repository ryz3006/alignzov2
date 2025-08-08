import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';

@Injectable()
export class WorkLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWorkLogDto: CreateWorkLogDto, userId: string) {
    // Check if user is super admin
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
    const isSuperAdmin = userRoleNames.includes('SUPER_ADMIN');
    
    // Validate that the project exists and user has access
    const project = await this.prisma.project.findUnique({
      where: { id: createWorkLogDto.projectId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has access to the project
    const isOwner = project.ownerId === userId;
    const isMember = project.members.length > 0;
    
    // Super admin has access to all projects
    if (isSuperAdmin) {
      // Super admin access granted
    } else if (!isOwner && !isMember) {
      throw new BadRequestException('You do not have access to this project');
    }

    return this.prisma.workLog.create({
      data: {
        ...createWorkLogDto,
        userId,
        startTime: new Date(createWorkLogDto.startTime),
        endTime: new Date(createWorkLogDto.endTime),
      },
      select: {
        id: true,
        userId: true,
        projectId: true,
        ticketId: true,
        description: true,
        duration: true,
        startTime: true,
        endTime: true,
        isBillable: true,
        hourlyRate: true,
        tags: true,
        metadata: true,
        importSource: true,
        importId: true,
        isApproved: true,
        approvedBy: true,
        approvedAt: true,
        // Enhanced fields for better work reporting and time tracking
        module: true,
        taskCategory: true,
        workCategory: true,
        severityCategory: true,
        sourceCategory: true,
        ticketReference: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        ticket: {
          select: {
            id: true,
            title: true,
            externalId: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, query: any = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      projectId,
      userId: filterUserId,
      startDate,
      endDate,
      isBillable,
      tags,
      sortBy = 'startTime',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause with access level scoping
    const where: any = {};

    // Determine requester's access scope
    const isAdmin = await this.prisma.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
      },
      select: { id: true },
    });

    if (!isAdmin) {
      const accessLevels = await this.prisma.userAccessLevel.findMany({
        where: { userId },
        select: { level: true },
      });
      const levelSet = new Set(accessLevels.map((l) => l.level));

      const clauses: any[] = [];
      // Individual scope always applies
      clauses.push({ userId });

      // Team scope
      if (levelSet.has('TEAM')) {
        const teamProjectIds = await this.prisma.projectTeam.findMany({
          where: {
            isActive: true,
            team: {
              members: { some: { userId, isActive: true } },
            },
          },
          select: { projectId: true },
        });
        if (teamProjectIds.length > 0) {
          clauses.push({ projectId: { in: teamProjectIds.map((t) => t.projectId) } });
        }
      }

      // Project scope
      if (levelSet.has('PROJECT')) {
        const projectIds = await this.prisma.projectMember.findMany({
          where: { userId, isActive: true },
          select: { projectId: true },
        });
        if (projectIds.length > 0) {
          clauses.push({ projectId: { in: projectIds.map((p) => p.projectId) } });
        }
      }

      // Organization scope (FULL_ACCESS)
      if (levelSet.has('FULL_ACCESS')) {
        // no where restriction
      } else {
        where.OR = clauses;
      }
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (startDate) {
      where.startTime = {
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.endTime = {
        lte: new Date(endDate),
      };
    }

    if (isBillable !== undefined) {
      where.isBillable = isBillable === 'true';
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { project: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [workLogs, total] = await Promise.all([
      this.prisma.workLog.findMany({
        where,
        select: {
          id: true,
          userId: true,
          projectId: true,
          ticketId: true,
          description: true,
          duration: true,
          startTime: true,
          endTime: true,
          isBillable: true,
          hourlyRate: true,
          tags: true,
          metadata: true,
          importSource: true,
          importId: true,
          isApproved: true,
          approvedBy: true,
          approvedAt: true,
          // Enhanced fields for better work reporting and time tracking
          module: true,
          taskCategory: true,
          workCategory: true,
          severityCategory: true,
          sourceCategory: true,
          ticketReference: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          ticket: {
            select: {
              id: true,
              title: true,
              externalId: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.workLog.count({ where }),
    ]);

    return {
      data: workLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const workLog = await this.prisma.workLog.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        projectId: true,
        ticketId: true,
        description: true,
        duration: true,
        startTime: true,
        endTime: true,
        isBillable: true,
        hourlyRate: true,
        tags: true,
        metadata: true,
        importSource: true,
        importId: true,
        isApproved: true,
        approvedBy: true,
        approvedAt: true,
        // Enhanced fields for better work reporting and time tracking
        module: true,
        taskCategory: true,
        workCategory: true,
        severityCategory: true,
        sourceCategory: true,
        ticketReference: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        ticket: {
          select: {
            id: true,
            title: true,
            externalId: true,
          },
        },
      },
    });

    if (!workLog) {
      throw new NotFoundException('Work log not found');
    }

    // Check if user has access to this work log via access levels
    if (workLog.userId !== userId) {
      // Admin roles bypass
      const isAdmin = await this.prisma.userRole.findFirst({
        where: {
          userId,
          isActive: true,
          role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
        },
      });
      if (!isAdmin) {
        const levels = await this.prisma.userAccessLevel.findMany({ where: { userId }, select: { level: true } });
        const levelSet = new Set(levels.map((l) => l.level));

        let allowed = false;
        // Team scope
        if (levelSet.has('TEAM')) {
          const sharedTeam = await this.prisma.teamMember.findFirst({
            where: {
              isActive: true,
              userId,
              team: {
                projects: { some: { projectId: workLog.projectId, isActive: true } },
              },
            },
          });
          if (sharedTeam) allowed = true;
        }
        // Project scope
        if (!allowed && levelSet.has('PROJECT')) {
          const projectMember = await this.prisma.projectMember.findFirst({
            where: { userId, projectId: workLog.projectId, isActive: true },
          });
          if (projectMember) allowed = true;
        }
        if (!allowed) {
          throw new BadRequestException('You do not have access to this work log');
        }
      }
    }

    return workLog;
  }

  async update(id: string, updateWorkLogDto: UpdateWorkLogDto, userId: string) {
    const workLog = await this.findOne(id, userId);

    // Only the owner or admin can update work logs
    if (workLog.userId !== userId) {
      throw new BadRequestException('You can only update your own work logs');
    }

    // If updating time, check for overlaps
    if (updateWorkLogDto.startTime || updateWorkLogDto.endTime) {
      const startTime = updateWorkLogDto.startTime ? new Date(updateWorkLogDto.startTime) : workLog.startTime;
      const endTime = updateWorkLogDto.endTime ? new Date(updateWorkLogDto.endTime) : workLog.endTime;

      const overlappingLogs = await this.prisma.workLog.findMany({
        where: {
          userId,
          id: { not: id },
          startTime: {
            lt: endTime,
          },
          endTime: {
            gt: startTime,
          },
        },
      });

      if (overlappingLogs.length > 0) {
        throw new BadRequestException('Time period overlaps with existing work logs');
      }
    }

    return this.prisma.workLog.update({
      where: { id },
      data: {
        ...updateWorkLogDto,
        ...(updateWorkLogDto.startTime && { startTime: new Date(updateWorkLogDto.startTime) }),
        ...(updateWorkLogDto.endTime && { endTime: new Date(updateWorkLogDto.endTime) }),
      },
      select: {
        id: true,
        userId: true,
        projectId: true,
        ticketId: true,
        description: true,
        duration: true,
        startTime: true,
        endTime: true,
        isBillable: true,
        hourlyRate: true,
        tags: true,
        metadata: true,
        importSource: true,
        importId: true,
        isApproved: true,
        approvedBy: true,
        approvedAt: true,
        // Enhanced fields for better work reporting and time tracking
        module: true,
        taskCategory: true,
        workCategory: true,
        severityCategory: true,
        sourceCategory: true,
        ticketReference: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        ticket: {
          select: {
            id: true,
            title: true,
            externalId: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const workLog = await this.findOne(id, userId);

    // Only the owner or admin can delete work logs
    if (workLog.userId !== userId) {
      throw new BadRequestException('You can only delete your own work logs');
    }

    return this.prisma.workLog.delete({
      where: { id },
    });
  }

  async approve(id: string, approverId: string) {
    const workLog = await this.prisma.workLog.findUnique({
      where: { id },
    });

    if (!workLog) {
      throw new NotFoundException('Work log not found');
    }

    return this.prisma.workLog.update({
      where: { id },
      data: {
        isApproved: true,
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });
  }

  async getAnalytics(userId: string, query: any = {}) {
    const { startDate, endDate, projectId } = query;

    const where: any = {};

    if (startDate) {
      where.startTime = {
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.endTime = {
        lte: new Date(endDate),
      };
    }

    if (projectId) {
      where.projectId = projectId;
    }

    // Get user's accessible projects
    const userProjects = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    where.OR = [
      { userId },
      { projectId: { in: userProjects.map(p => p.projectId) } },
    ];

    const [totalHours, totalBillableHours, totalWorkLogs, projectStats] = await Promise.all([
      // Total hours
      this.prisma.workLog.aggregate({
        where,
        _sum: {
          duration: true,
        },
      }),
      // Total billable hours
      this.prisma.workLog.aggregate({
        where: { ...where, isBillable: true },
        _sum: {
          duration: true,
        },
      }),
      // Total work logs
      this.prisma.workLog.count({ where }),
      // Project statistics
      this.prisma.workLog.groupBy({
        by: ['projectId'],
        where,
        _sum: {
          duration: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      totalHours: Math.round((totalHours._sum.duration || 0) / 3600 * 100) / 100,
      totalBillableHours: Math.round((totalBillableHours._sum.duration || 0) / 3600 * 100) / 100,
      totalWorkLogs,
      projectStats: await Promise.all(
        projectStats.map(async (stat) => {
          const project = await this.prisma.project.findUnique({
            where: { id: stat.projectId },
            select: { name: true, code: true },
          });
          return {
            projectId: stat.projectId,
            projectName: project?.name,
            projectCode: project?.code,
            hours: Math.round((stat._sum.duration || 0) / 3600 * 100) / 100,
            workLogs: stat._count.id,
          };
        })
      ),
    };
  }
} 