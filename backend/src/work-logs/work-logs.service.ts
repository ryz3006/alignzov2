import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { Prisma, WorkLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';
import { DataScopeService } from '../common/services/data-scope.service';

@Injectable()
export class WorkLogsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly dataScopeService?: DataScopeService,
  ) {}

  async create(
    createWorkLogDto: CreateWorkLogDto,
    userId: string,
  ): Promise<WorkLog> {
    // Ensure project exists and user has access (owner or member)
    const project = await this.prisma.project.findUnique({
      where: { id: createWorkLogDto.projectId },
      select: {
        id: true,
        ownerId: true,
        members: { select: { userId: true } },
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isOwner && !isMember) {
      throw new BadRequestException('You do not have access to this project');
    }

    // Overlap check
    const start = new Date(createWorkLogDto.startTime);
    const end = new Date(createWorkLogDto.endTime);
    const overlapping = await this.prisma.workLog.findMany({
      where: {
        userId,
        OR: [
          { startTime: { lte: start }, endTime: { gte: start } },
          { startTime: { lte: end }, endTime: { gte: end } },
          { startTime: { gte: start }, endTime: { lte: end } },
        ],
      },
    });
    if (overlapping.length > 0) {
      throw new BadRequestException(
        'Time period overlaps with existing work log',
      );
    }

    return this.prisma.workLog.create({
      data: {
        ...createWorkLogDto,
        userId,
        startTime: start,
        endTime: end,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        project: { select: { id: true, name: true, code: true } },
        ticket: { select: { id: true, title: true, externalId: true } },
      },
    });
  }

  async findAll(userId: string, query: any = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'startTime',
      sortOrder = 'desc',
      ...filters
    } = query;
    const skip = (page - 1) * limit;

    const whereScope = this.dataScopeService
      ? await this.dataScopeService.getAccessScopeWhereClause(
          userId,
          'work-log',
        )
      : ({} as Prisma.WorkLogWhereInput);

    const filterWhere: Prisma.WorkLogWhereInput = {};
    if (filters.projectId) filterWhere.projectId = filters.projectId;
    if (filters.userId) filterWhere.userId = filters.userId;
    if (filters.startDate)
      filterWhere.startTime = { gte: new Date(filters.startDate) };
    if (filters.endDate)
      filterWhere.endTime = { lte: new Date(filters.endDate) };
    if (filters.isBillable)
      filterWhere.isBillable = filters.isBillable === 'true';

    const finalWhere: Prisma.WorkLogWhereInput = {
      AND: [whereScope, filterWhere],
    };

    if (search) {
      (finalWhere.AND as Prisma.WorkLogWhereInput[]).push({
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { project: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    const [workLogs, total] = await this.prisma.$transaction([
      this.prisma.workLog.findMany({
        where: finalWhere,
        include: { user: true, project: true, ticket: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.workLog.count({ where: finalWhere }),
    ]);

    return {
      data: workLogs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string): Promise<WorkLog> {
    // Fetch by ID first
    const workLog = await this.prisma.workLog.findUnique({
      where: { id },
      include: { user: true, project: true, ticket: true },
    });
    if (!workLog) {
      throw new NotFoundException('Work log not found');
    }

    // Verify access against scope
    const whereScope = this.dataScopeService
      ? await this.dataScopeService.getAccessScopeWhereClause(
          userId,
          'work-log',
        )
      : ({} as Prisma.WorkLogWhereInput);
    const inScope = await this.prisma.workLog.findFirst({
      where: { AND: [whereScope, { id }] },
    });
    if (!inScope) {
      throw new BadRequestException('You do not have access to this work log');
    }
    return workLog;
  }

  async update(
    id: string,
    updateWorkLogDto: UpdateWorkLogDto,
    userId: string,
  ): Promise<WorkLog> {
    await this.findOne(id, userId); // Permission check
    return this.prisma.workLog.update({
      where: { id },
      data: {
        ...updateWorkLogDto,
        ...(updateWorkLogDto.startTime && {
          startTime: new Date(updateWorkLogDto.startTime),
        }),
        ...(updateWorkLogDto.endTime && {
          endTime: new Date(updateWorkLogDto.endTime),
        }),
      },
    });
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    await this.findOne(id, userId); // Permission check
    await this.prisma.workLog.delete({ where: { id } });
    return { message: 'Work log deleted successfully' };
  }

  async approve(id: string, approverId: string): Promise<WorkLog> {
    await this.findOne(id, approverId); // Check if approver can see the log
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
    const whereScope = this.dataScopeService
      ? await this.dataScopeService.getAccessScopeWhereClause(
          userId,
          'work-log',
        )
      : ({} as Prisma.WorkLogWhereInput);

    const finalWhere: Prisma.WorkLogWhereInput = { AND: [whereScope] };
    if (startDate)
      (finalWhere.AND as Prisma.WorkLogWhereInput[]).push({
        startTime: { gte: new Date(startDate) },
      });
    if (endDate)
      (finalWhere.AND as Prisma.WorkLogWhereInput[]).push({
        endTime: { lte: new Date(endDate) },
      });
    if (projectId)
      (finalWhere.AND as Prisma.WorkLogWhereInput[]).push({ projectId });

    const [totalHours, totalBillableHours, totalWorkLogs, projectStats] =
      await Promise.all([
        this.prisma.workLog.aggregate({
          where: finalWhere,
          _sum: { duration: true },
        }),
        this.prisma.workLog.aggregate({
          where: { ...finalWhere, isBillable: true },
          _sum: { duration: true },
        }),
        this.prisma.workLog.count({ where: finalWhere }),
        this.prisma.workLog.groupBy({
          by: ['projectId'],
          where: finalWhere,
          _sum: { duration: true },
          _count: { _all: true },
        }),
      ]);

    return {
      totalHours:
        Math.round(((totalHours._sum.duration || 0) / 3600) * 100) / 100,
      totalBillableHours:
        Math.round(((totalBillableHours._sum.duration || 0) / 3600) * 100) /
        100,
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
            hours: Math.round(((stat._sum.duration || 0) / 3600) * 100) / 100,
            workLogs: stat._count._all,
          };
        }),
      ),
    };
  }
}
