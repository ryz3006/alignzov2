import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    // Get user's accessible projects
    const userProjects = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = userProjects.map(p => p.projectId);

    const [
      totalUsers,
      totalHours,
      totalRevenue,
      activeProjects,
      totalWorkLogs,
      totalTimeSessions,
      recentActivity,
    ] = await Promise.all([
      // Total users in accessible projects
      this.prisma.user.count({
        where: {
          OR: [
            { id: userId },
            {
              projectMembers: {
                some: {
                  projectId: { in: projectIds },
                },
              },
            },
          ],
        },
      }),

      // Total hours tracked
      this.prisma.workLog.aggregate({
        where: {
          OR: [
            { userId },
            { projectId: { in: projectIds } },
          ],
        },
        _sum: {
          duration: true,
        },
      }),

      // Total revenue (billable hours * hourly rate)
      this.prisma.workLog.aggregate({
        where: {
          OR: [
            { userId },
            { projectId: { in: projectIds } },
          ],
          isBillable: true,
          hourlyRate: { not: null },
        },
        _sum: {
          duration: true,
        },
      }),

      // Active projects
      this.prisma.project.count({
        where: {
          id: { in: projectIds },
          status: 'ACTIVE',
        },
      }),

      // Total work logs
      this.prisma.workLog.count({
        where: {
          OR: [
            { userId },
            { projectId: { in: projectIds } },
          ],
        },
      }),

      // Total time sessions
      this.prisma.timeSession.count({
        where: {
          OR: [
            { userId },
            { projectId: { in: projectIds } },
          ],
        },
      }),

      // Recent activity (last 7 days)
      this.prisma.workLog.findMany({
        where: {
          OR: [
            { userId },
            { projectId: { in: projectIds } },
          ],
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          project: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    return {
      totalUsers,
      totalHours: Math.round((totalHours._sum.duration || 0) / 3600 * 100) / 100,
      totalRevenue: Math.round((totalRevenue._sum.duration || 0) / 3600 * 100) / 100,
      activeProjects,
      totalWorkLogs,
      totalTimeSessions,
      recentActivity,
    };
  }

  async getTimeTrackingAnalytics(userId: string, query: any = {}) {
    const { startDate, endDate, projectId, groupBy = 'day' } = query;

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

    // Get time tracking data grouped by the specified period
    const timeData = await this.prisma.workLog.groupBy({
      by: ['startTime'],
      where,
      _sum: {
        duration: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get project breakdown
    const projectBreakdown = await this.prisma.workLog.groupBy({
      by: ['projectId'],
      where,
      _sum: {
        duration: true,
      },
      _count: {
        id: true,
      },
    });

    // Get user breakdown
    const userBreakdown = await this.prisma.workLog.groupBy({
      by: ['userId'],
      where,
      _sum: {
        duration: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      timeData: timeData.map(item => ({
        date: item.startTime,
        hours: Math.round((item._sum.duration || 0) / 3600 * 100) / 100,
        workLogs: item._count.id,
      })),
      projectBreakdown: await Promise.all(
        projectBreakdown.map(async (item) => {
          const project = await this.prisma.project.findUnique({
            where: { id: item.projectId },
            select: { name: true, code: true },
          });
          return {
            projectId: item.projectId,
            projectName: project?.name,
            projectCode: project?.code,
            hours: Math.round((item._sum.duration || 0) / 3600 * 100) / 100,
            workLogs: item._count.id,
          };
        })
      ),
      userBreakdown: await Promise.all(
        userBreakdown.map(async (item) => {
          const user = await this.prisma.user.findUnique({
            where: { id: item.userId },
            select: { firstName: true, lastName: true, email: true },
          });
          return {
            userId: item.userId,
            userName: `${user?.firstName} ${user?.lastName}`,
            userEmail: user?.email,
            hours: Math.round((item._sum.duration || 0) / 3600 * 100) / 100,
            workLogs: item._count.id,
          };
        })
      ),
    };
  }

  async getProjectAnalytics(userId: string, query: any = {}) {
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

    const [projectStats, projectProgress, teamPerformance] = await Promise.all([
      // Project statistics
      this.prisma.project.findMany({
        where: {
          id: { in: userProjects.map(p => p.projectId) },
        },
        include: {
          _count: {
            select: {
              members: true,
              workLogs: true,
            },
          },
          workLogs: {
            where,
            select: {
              duration: true,
              isBillable: true,
            },
          },
        },
      }),

      // Project progress over time
      this.prisma.workLog.groupBy({
        by: ['projectId', 'startTime'],
        where,
        _sum: {
          duration: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      }),

      // Team performance
      this.prisma.workLog.groupBy({
        by: ['projectId', 'userId'],
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
      projectStats: projectStats.map(project => {
        const totalHours = project.workLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
        const billableHours = project.workLogs
          .filter(log => log.isBillable)
          .reduce((sum, log) => sum + (log.duration || 0), 0);

        return {
          projectId: project.id,
          projectName: project.name,
          projectCode: project.code,
          status: project.status,
          totalMembers: project._count.members,
          totalWorkLogs: project._count.workLogs,
          totalHours: Math.round(totalHours / 3600 * 100) / 100,
          billableHours: Math.round(billableHours / 3600 * 100) / 100,
          efficiency: project._count.workLogs > 0 ? Math.round((billableHours / totalHours) * 100) : 0,
        };
      }),
      projectProgress: await Promise.all(
        projectProgress.map(async (item) => {
          const project = await this.prisma.project.findUnique({
            where: { id: item.projectId },
            select: { name: true, code: true },
          });
          return {
            projectId: item.projectId,
            projectName: project?.name,
            projectCode: project?.code,
            date: item.startTime,
            hours: Math.round((item._sum.duration || 0) / 3600 * 100) / 100,
          };
        })
      ),
      teamPerformance: await Promise.all(
        teamPerformance.map(async (item) => {
          const [project, user] = await Promise.all([
            this.prisma.project.findUnique({
              where: { id: item.projectId },
              select: { name: true, code: true },
            }),
            this.prisma.user.findUnique({
              where: { id: item.userId },
              select: { firstName: true, lastName: true, email: true },
            }),
          ]);
          return {
            projectId: item.projectId,
            projectName: project?.name,
            projectCode: project?.code,
            userId: item.userId,
            userName: `${user?.firstName} ${user?.lastName}`,
            userEmail: user?.email,
            hours: Math.round((item._sum.duration || 0) / 3600 * 100) / 100,
            workLogs: item._count.id,
          };
        })
      ),
    };
  }

  async getTeamAnalytics(userId: string, query: any = {}) {
    const { startDate, endDate, teamId } = query;

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

    // Get user's accessible teams
    const userTeams = await this.prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    const teamIds = userTeams.map(t => t.teamId);

    if (teamId) {
      where.teamId = teamId;
    }

    const [teamStats, memberPerformance, teamProgress] = await Promise.all([
      // Team statistics
      this.prisma.team.findMany({
        where: {
          id: { in: teamIds },
        },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),

      // Member performance
      this.prisma.workLog.groupBy({
        by: ['userId'],
        where: {
          ...where,
          user: {
            teamMembers: {
              some: {
                teamId: { in: teamIds },
              },
            },
          },
        },
        _sum: {
          duration: true,
        },
        _count: {
          id: true,
        },
      }),

      // Team progress over time
      this.prisma.workLog.groupBy({
        by: ['startTime'],
        where: {
          ...where,
          user: {
            teamMembers: {
              some: {
                teamId: { in: teamIds },
              },
            },
          },
        },
        _sum: {
          duration: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      }),
    ]);

    return {
      teamStats: teamStats.map(team => ({
        teamId: team.id,
        teamName: team.name,
        teamDescription: team.description,
        totalMembers: team._count.members,
        members: team.members.map(member => ({
          userId: member.userId,
          userName: `${member.user.firstName} ${member.user.lastName}`,
          userEmail: member.user.email,
          role: member.role,
        })),
      })),
      memberPerformance: await Promise.all(
        memberPerformance.map(async (item) => {
          const user = await this.prisma.user.findUnique({
            where: { id: item.userId },
            select: { firstName: true, lastName: true, email: true },
          });
          return {
            userId: item.userId,
            userName: `${user?.firstName} ${user?.lastName}`,
            userEmail: user?.email,
            hours: Math.round((item._sum.duration || 0) / 3600 * 100) / 100,
            workLogs: item._count.id,
          };
        })
      ),
      teamProgress: teamProgress.map(item => ({
        date: item.startTime,
        hours: Math.round((item._sum.duration || 0) / 3600 * 100) / 100,
      })),
    };
  }

  async getProductivityMetrics(userId: string, query: any = {}) {
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

    const [billableHours, totalHours, workLogs, timeSessions] = await Promise.all([
      // Billable hours
      this.prisma.workLog.aggregate({
        where: { ...where, isBillable: true },
        _sum: {
          duration: true,
        },
      }),

      // Total hours
      this.prisma.workLog.aggregate({
        where,
        _sum: {
          duration: true,
        },
      }),

      // Work logs count
      this.prisma.workLog.count({ where }),

      // Time sessions count
      this.prisma.timeSession.count({
        where: {
          ...where,
          status: 'COMPLETED',
        },
      }),
    ]);

    const totalHoursValue = totalHours._sum.duration || 0;
    const billableHoursValue = billableHours._sum.duration || 0;

    return {
      totalHours: Math.round(totalHoursValue / 3600 * 100) / 100,
      billableHours: Math.round(billableHoursValue / 3600 * 100) / 100,
      billablePercentage: totalHoursValue > 0 ? Math.round((billableHoursValue / totalHoursValue) * 100) : 0,
      totalWorkLogs: workLogs,
      completedTimeSessions: timeSessions,
      averageSessionLength: timeSessions > 0 ? Math.round(totalHoursValue / timeSessions / 3600 * 100) / 100 : 0,
      efficiency: totalHoursValue > 0 ? Math.round((billableHoursValue / totalHoursValue) * 100) : 0,
    };
  }
} 