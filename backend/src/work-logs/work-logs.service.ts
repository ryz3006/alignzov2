import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, WorkLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';
import { DataScopeService } from '../common/services/data-scope.service';

@Injectable()
export class WorkLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  async create(createWorkLogDto: CreateWorkLogDto, userId: string): Promise<WorkLog> {
    return this.prisma.workLog.create({
      data: {
        ...createWorkLogDto,
        userId,
        startTime: new Date(createWorkLogDto.startTime),
        endTime: new Date(createWorkLogDto.endTime),
      },
    });
  }

  async findAll(userId: string, query: any = {}) {
    const { page = 1, limit = 20, search, sortBy = 'startTime', sortOrder = 'desc', ...filters } = query;
    const skip = (page - 1) * limit;

    const whereScope = await this.dataScopeService.getAccessScopeWhereClause(userId, 'work-log');

    const filterWhere: Prisma.WorkLogWhereInput = {};
    if (filters.projectId) filterWhere.projectId = filters.projectId;
    if (filters.userId) filterWhere.userId = filters.userId;
    if (filters.startDate) filterWhere.startTime = { gte: new Date(filters.startDate) };
    if (filters.endDate) filterWhere.endTime = { lte: new Date(filters.endDate) };
    if (filters.isBillable) filterWhere.isBillable = filters.isBillable === 'true';

    const finalWhere: Prisma.WorkLogWhereInput = { AND: [whereScope, filterWhere] };

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
    const whereScope = await this.dataScopeService.getAccessScopeWhereClause(userId, 'work-log');
    const finalWhere: Prisma.WorkLogWhereInput = { AND: [whereScope, { id }] };

    const workLog = await this.prisma.workLog.findFirst({
      where: finalWhere,
      include: { user: true, project: true, ticket: true },
    });

    if (!workLog) {
      throw new NotFoundException('Work log not found or you do not have access');
    }
    return workLog;
  }

  async update(id: string, updateWorkLogDto: UpdateWorkLogDto, userId: string): Promise<WorkLog> {
    await this.findOne(id, userId); // Permission check
    return this.prisma.workLog.update({
      where: { id },
      data: {
        ...updateWorkLogDto,
        ...(updateWorkLogDto.startTime && { startTime: new Date(updateWorkLogDto.startTime) }),
        ...(updateWorkLogDto.endTime && { endTime: new Date(updateWorkLogDto.endTime) }),
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
      data: { isApproved: true, approvedBy: approverId, approvedAt: new Date() },
    });
  }

  async getAnalytics(userId: string, query: any = {}) {
    const { startDate, endDate, projectId } = query;
    const whereScope = await this.dataScopeService.getAccessScopeWhereClause(userId, 'work-log');
    
    const finalWhere: Prisma.WorkLogWhereInput = { AND: [whereScope] };
    if (startDate) (finalWhere.AND as Prisma.WorkLogWhereInput[]).push({ startTime: { gte: new Date(startDate) } });
    if (endDate) (finalWhere.AND as Prisma.WorkLogWhereInput[]).push({ endTime: { lte: new Date(endDate) } });
    if (projectId) (finalWhere.AND as Prisma.WorkLogWhereInput[]).push({ projectId });

    const [totalHours, totalBillableHours, totalWorkLogs, projectStats] = await Promise.all([
      this.prisma.workLog.aggregate({ where: finalWhere, _sum: { duration: true } }),
      this.prisma.workLog.aggregate({ where: { ...finalWhere, isBillable: true }, _sum: { duration: true } }),
      this.prisma.workLog.count({ where: finalWhere }),
      this.prisma.workLog.groupBy({ by: ['projectId'], where: finalWhere, _sum: { duration: true }, _count: { _all: true } }),
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
            workLogs: stat._count._all,
          };
        }),
      ),
    };
  }
}
