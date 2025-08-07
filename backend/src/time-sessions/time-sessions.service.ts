import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeSessionDto } from './dto/create-time-session.dto';
import { UpdateTimeSessionDto } from './dto/update-time-session.dto';
import { TimeSessionStatus } from './dto/create-time-session.dto';

@Injectable()
export class TimeSessionsService {
  constructor(private prisma: PrismaService) {}

  async create(createTimeSessionDto: CreateTimeSessionDto, userId: string) {
    // Remove the check for existing active session to allow multiple active timers
    // const activeSession = await this.prisma.timeSession.findFirst({
    //   where: {
    //     userId: userId,
    //     status: TimeSessionStatus.RUNNING,
    //   },
    // });

    // if (activeSession) {
    //   throw new ForbiddenException('You already have an active time session');
    // }

    // Prepare the data object, filtering out undefined values
    const sessionData: any = {
      userId: userId,
      startTime: new Date(),
      status: TimeSessionStatus.RUNNING,
    };

    // Only add optional fields if they are provided
    if (createTimeSessionDto.projectId) {
      sessionData.projectId = createTimeSessionDto.projectId;
    }
    if (createTimeSessionDto.ticketId) {
      sessionData.ticketId = createTimeSessionDto.ticketId;
    }
    if (createTimeSessionDto.description) {
      sessionData.description = createTimeSessionDto.description;
    }
    if (createTimeSessionDto.module) {
      sessionData.module = createTimeSessionDto.module;
    }
    if (createTimeSessionDto.taskCategory) {
      sessionData.taskCategory = createTimeSessionDto.taskCategory;
    }
    if (createTimeSessionDto.workCategory) {
      sessionData.workCategory = createTimeSessionDto.workCategory;
    }
    if (createTimeSessionDto.severityCategory) {
      sessionData.severityCategory = createTimeSessionDto.severityCategory;
    }
    if (createTimeSessionDto.sourceCategory) {
      sessionData.sourceCategory = createTimeSessionDto.sourceCategory;
    }
    if (createTimeSessionDto.ticketReference) {
      sessionData.ticketReference = createTimeSessionDto.ticketReference;
    }

    const timeSession = await this.prisma.timeSession.create({
      data: sessionData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return timeSession;
  }

  async findAll(userId: string, userRole: string, query: any = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      projectId,
      search,
    } = query;

    const skip = (page - 1) * parseInt(limit.toString());
    const take = parseInt(limit.toString());

    // Build where clause - Always filter by user's own data
    const where: any = {
      userId: userId, // Only show user's own time sessions
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [timeSessions, total] = await Promise.all([
      this.prisma.timeSession.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.timeSession.count({ where }),
    ]);

    return {
      data: timeSessions,
      meta: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    // Always filter by user's own data
    const timeSession = await this.prisma.timeSession.findFirst({
      where: {
        id: id,
        userId: userId, // Only allow access to user's own time sessions
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!timeSession) {
      throw new NotFoundException(`Time session with ID ${id} not found`);
    }

    return timeSession;
  }

  async pause(id: string, userId: string) {
    const timeSession = await this.findOne(id, userId, 'EMPLOYEE'); // Use employee role for self-access

    if (timeSession.status !== TimeSessionStatus.RUNNING) {
      throw new ForbiddenException('Only running time sessions can be paused');
    }

    // Calculate the current paused duration
    const currentPausedDuration = timeSession.pausedDuration || 0;
    const pauseStartTime = new Date();
    
    // Handle metadata properly
    const currentMetadata = typeof timeSession.metadata === 'object' && timeSession.metadata !== null 
      ? timeSession.metadata as Record<string, any>
      : {};
    
    const pausedSession = await this.prisma.timeSession.update({
      where: {
        id: id,
      },
      data: {
        status: TimeSessionStatus.PAUSED,
        endTime: pauseStartTime,
        pausedDuration: currentPausedDuration, // Keep the existing paused duration
        metadata: {
          ...currentMetadata,
          pauseStartTime: pauseStartTime.toISOString(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return pausedSession;
  }

  async resume(id: string, userId: string) {
    const timeSession = await this.findOne(id, userId, 'EMPLOYEE');

    if (timeSession.status !== TimeSessionStatus.PAUSED) {
      throw new ForbiddenException('Only paused time sessions can be resumed');
    }

    // Calculate the additional paused time since last pause
    const currentMetadata = typeof timeSession.metadata === 'object' && timeSession.metadata !== null 
      ? timeSession.metadata as Record<string, any>
      : {};
    const pauseStartTime = currentMetadata.pauseStartTime;
    let additionalPausedTime = 0;
    
    if (pauseStartTime && typeof pauseStartTime === 'string') {
      const pauseStart = new Date(pauseStartTime);
      const resumeTime = new Date();
      additionalPausedTime = resumeTime.getTime() - pauseStart.getTime();
    }

    // Update the total paused duration
    const totalPausedDuration = (timeSession.pausedDuration || 0) + additionalPausedTime;

    const resumedSession = await this.prisma.timeSession.update({
      where: {
        id: id,
      },
      data: {
        status: TimeSessionStatus.RUNNING,
        endTime: null, // Clear end time when resuming
        pausedDuration: totalPausedDuration,
        metadata: {
          ...currentMetadata,
          pauseStartTime: null, // Clear pause start time
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return resumedSession;
  }

  async stop(id: string, userId: string) {
    const timeSession = await this.findOne(id, userId, 'EMPLOYEE'); // Use employee role for self-access

    if (timeSession.status === TimeSessionStatus.COMPLETED) {
      throw new ForbiddenException('Time session is already completed');
    }

    const stoppedSession = await this.prisma.timeSession.update({
      where: {
        id: id,
      },
      data: {
        status: TimeSessionStatus.COMPLETED,
        endTime: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return stoppedSession;
  }

  async convertToWorkLog(id: string, userId: string) {
    const timeSession = await this.findOne(id, userId, 'EMPLOYEE');

    if (timeSession.status !== TimeSessionStatus.COMPLETED) {
      throw new ForbiddenException('Only completed time sessions can be converted to work logs');
    }

    if (!timeSession.endTime) {
      throw new ForbiddenException('Time session must have an end time to be converted');
    }

    // Calculate duration in seconds
    const duration = Math.floor((timeSession.endTime.getTime() - timeSession.startTime.getTime()) / 1000);

    // Create work log with all the category fields using any type to bypass Prisma type issues
    const workLogData: any = {
      userId: timeSession.userId,
      projectId: timeSession.projectId,
      ticketId: timeSession.ticketId,
      description: timeSession.description || 'Time session converted to work log',
      duration: duration,
      startTime: timeSession.startTime,
      endTime: timeSession.endTime,
      isBillable: true,
      importSource: 'time_session',
      importId: timeSession.id,
    };

    // Add category fields if they exist (using type assertion to access schema fields)
    const timeSessionAny = timeSession as any;
    if (timeSessionAny.module) workLogData.module = timeSessionAny.module;
    if (timeSessionAny.taskCategory) workLogData.taskCategory = timeSessionAny.taskCategory;
    if (timeSessionAny.workCategory) workLogData.workCategory = timeSessionAny.workCategory;
    if (timeSessionAny.severityCategory) workLogData.severityCategory = timeSessionAny.severityCategory;
    if (timeSessionAny.sourceCategory) workLogData.sourceCategory = timeSessionAny.sourceCategory;
    if (timeSessionAny.ticketReference) workLogData.ticketReference = timeSessionAny.ticketReference;

    const workLog = await this.prisma.workLog.create({
      data: workLogData,
      include: {
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
      },
    });

    // Delete the time session after conversion
    await this.prisma.timeSession.delete({
      where: { id: timeSession.id },
    });

    return workLog;
  }

  async update(id: string, updateTimeSessionDto: UpdateTimeSessionDto, userId: string) {
    // Check if time session exists and user has access
    await this.findOne(id, userId, 'EMPLOYEE');

    // Prepare the update data, filtering out undefined values
    const updateData: any = {};
    
    if (updateTimeSessionDto.projectId !== undefined) {
      updateData.projectId = updateTimeSessionDto.projectId;
    }
    if (updateTimeSessionDto.ticketId !== undefined) {
      updateData.ticketId = updateTimeSessionDto.ticketId;
    }
    if (updateTimeSessionDto.description !== undefined) {
      updateData.description = updateTimeSessionDto.description;
    }
    if (updateTimeSessionDto.status !== undefined) {
      updateData.status = updateTimeSessionDto.status;
    }
    if (updateTimeSessionDto.startTime !== undefined) {
      updateData.startTime = new Date(updateTimeSessionDto.startTime);
    }
    if (updateTimeSessionDto.endTime !== undefined) {
      updateData.endTime = new Date(updateTimeSessionDto.endTime);
    }
    if (updateTimeSessionDto.module !== undefined) {
      updateData.module = updateTimeSessionDto.module;
    }
    if (updateTimeSessionDto.taskCategory !== undefined) {
      updateData.taskCategory = updateTimeSessionDto.taskCategory;
    }
    if (updateTimeSessionDto.workCategory !== undefined) {
      updateData.workCategory = updateTimeSessionDto.workCategory;
    }
    if (updateTimeSessionDto.severityCategory !== undefined) {
      updateData.severityCategory = updateTimeSessionDto.severityCategory;
    }
    if (updateTimeSessionDto.sourceCategory !== undefined) {
      updateData.sourceCategory = updateTimeSessionDto.sourceCategory;
    }
    if (updateTimeSessionDto.ticketReference !== undefined) {
      updateData.ticketReference = updateTimeSessionDto.ticketReference;
    }

    const updatedSession = await this.prisma.timeSession.update({
      where: {
        id: id,
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return updatedSession;
  }

  async remove(id: string, userId: string) {
    // Check if time session exists and user has access
    await this.findOne(id, userId, 'EMPLOYEE');

    await this.prisma.timeSession.delete({
      where: {
        id: id,
      },
    });

    return { message: 'Time session deleted successfully' };
  }
} 