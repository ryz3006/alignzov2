import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    projectMember: {
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    workLog: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    timeSession: {
      count: jest.fn(),
    },
    teamMember: {
      findMany: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    const userId = 'user-123';

    it('should return dashboard statistics', async () => {
      const mockUserProjects = [{ projectId: 'project-123' }];
      const mockTotalUsers = 5;
      const mockTotalHours = { _sum: { duration: 7200 } };
      const mockTotalRevenue = { _sum: { duration: 3600 } };
      const mockActiveProjects = 2;
      const mockTotalWorkLogs = 10;
      const mockTotalTimeSessions = 15;
      const mockRecentActivity = [
        {
          id: 'worklog-123',
          description: 'Recent work',
          user: { firstName: 'John', lastName: 'Doe' },
          project: { name: 'Test Project' },
        },
      ];

      mockPrismaService.projectMember.findMany.mockResolvedValue(
        mockUserProjects,
      );
      mockPrismaService.user.count.mockResolvedValue(mockTotalUsers);
      mockPrismaService.workLog.aggregate
        .mockResolvedValueOnce(mockTotalHours)
        .mockResolvedValueOnce(mockTotalRevenue);
      mockPrismaService.project.count.mockResolvedValue(mockActiveProjects);
      mockPrismaService.workLog.count.mockResolvedValue(mockTotalWorkLogs);
      mockPrismaService.timeSession.count.mockResolvedValue(
        mockTotalTimeSessions,
      );
      mockPrismaService.workLog.findMany.mockResolvedValue(mockRecentActivity);

      const result = await service.getDashboardStats(userId);

      expect(result).toEqual({
        totalUsers: 5,
        totalHours: 2,
        totalRevenue: 1,
        activeProjects: 2,
        totalWorkLogs: 10,
        totalTimeSessions: 15,
        recentActivity: mockRecentActivity,
      });
    });
  });

  describe('getTimeTrackingAnalytics', () => {
    const userId = 'user-123';
    const query = { startDate: '2024-01-01', endDate: '2024-01-31' };

    it('should return time tracking analytics', async () => {
      const mockUserProjects = [{ projectId: 'project-123' }];
      const mockTimeData = [
        {
          startTime: new Date('2024-01-15T09:00:00Z'),
          _sum: { duration: 3600 },
          _count: { id: 1 },
        },
      ];
      const mockProjectBreakdown = [
        {
          projectId: 'project-123',
          _sum: { duration: 3600 },
          _count: { id: 1 },
        },
      ];
      const mockUserBreakdown = [
        {
          userId: 'user-123',
          _sum: { duration: 3600 },
          _count: { id: 1 },
        },
      ];

      mockPrismaService.projectMember.findMany.mockResolvedValue(
        mockUserProjects,
      );
      mockPrismaService.workLog.groupBy
        .mockResolvedValueOnce(mockTimeData)
        .mockResolvedValueOnce(mockProjectBreakdown)
        .mockResolvedValueOnce(mockUserBreakdown);
      mockPrismaService.project.findUnique.mockResolvedValue({
        name: 'Test Project',
        code: 'TEST',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      const result = await service.getTimeTrackingAnalytics(userId, query);

      expect(result).toEqual({
        timeData: [
          {
            date: new Date('2024-01-15T09:00:00Z'),
            hours: 1,
            workLogs: 1,
          },
        ],
        projectBreakdown: [
          {
            projectId: 'project-123',
            projectName: 'Test Project',
            projectCode: 'TEST',
            hours: 1,
            workLogs: 1,
          },
        ],
        userBreakdown: [
          {
            userId: 'user-123',
            userName: 'John Doe',
            userEmail: 'john@example.com',
            hours: 1,
            workLogs: 1,
          },
        ],
      });
    });
  });

  describe('getProjectAnalytics', () => {
    const userId = 'user-123';
    const query = { startDate: '2024-01-01', endDate: '2024-01-31' };

    it('should return project analytics', async () => {
      const mockUserProjects = [{ projectId: 'project-123' }];
      const mockProjectStats = [
        {
          id: 'project-123',
          name: 'Test Project',
          code: 'TEST',
          status: 'ACTIVE',
          _count: { members: 3, workLogs: 5 },
          workLogs: [
            { duration: 3600, isBillable: true },
            { duration: 1800, isBillable: false },
          ],
        },
      ];
      const mockProjectProgress = [
        {
          projectId: 'project-123',
          startTime: new Date('2024-01-15T09:00:00Z'),
          _sum: { duration: 3600 },
        },
      ];
      const mockTeamPerformance = [
        {
          projectId: 'project-123',
          userId: 'user-123',
          _sum: { duration: 3600 },
          _count: { id: 1 },
        },
      ];

      mockPrismaService.projectMember.findMany.mockResolvedValue(
        mockUserProjects,
      );
      mockPrismaService.project.findMany.mockResolvedValue(mockProjectStats);
      mockPrismaService.workLog.groupBy
        .mockResolvedValueOnce(mockProjectProgress)
        .mockResolvedValueOnce(mockTeamPerformance);
      mockPrismaService.project.findUnique.mockResolvedValue({
        name: 'Test Project',
        code: 'TEST',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      const result = await service.getProjectAnalytics(userId, query);

      expect(result.projectStats).toHaveLength(1);
      expect(result.projectStats[0]).toEqual({
        projectId: 'project-123',
        projectName: 'Test Project',
        projectCode: 'TEST',
        status: 'ACTIVE',
        totalMembers: 3,
        totalWorkLogs: 5,
        totalHours: 1.5,
        billableHours: 1,
        efficiency: 67,
      });
    });
  });

  describe('getTeamAnalytics', () => {
    const userId = 'user-123';
    const query = { startDate: '2024-01-01', endDate: '2024-01-31' };

    it('should return team analytics', async () => {
      const mockUserTeams = [{ teamId: 'team-123' }];
      const mockTeamStats = [
        {
          id: 'team-123',
          name: 'Test Team',
          description: 'Test team description',
          _count: { members: 3 },
          members: [
            {
              userId: 'user-123',
              user: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
              },
              role: 'lead',
            },
          ],
        },
      ];
      const mockMemberPerformance = [
        {
          userId: 'user-123',
          _sum: { duration: 3600 },
          _count: { id: 1 },
        },
      ];
      const mockTeamProgress = [
        {
          startTime: new Date('2024-01-15T09:00:00Z'),
          _sum: { duration: 3600 },
        },
      ];

      mockPrismaService.teamMember.findMany.mockResolvedValue(mockUserTeams);
      mockPrismaService.team.findMany.mockResolvedValue(mockTeamStats);
      mockPrismaService.workLog.groupBy
        .mockResolvedValueOnce(mockMemberPerformance)
        .mockResolvedValueOnce(mockTeamProgress);
      mockPrismaService.user.findUnique.mockResolvedValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      const result = await service.getTeamAnalytics(userId, query);

      expect(result.teamStats).toHaveLength(1);
      expect(result.teamStats[0]).toEqual({
        teamId: 'team-123',
        teamName: 'Test Team',
        teamDescription: 'Test team description',
        totalMembers: 3,
        members: [
          {
            userId: 'user-123',
            userName: 'John Doe',
            userEmail: 'john@example.com',
            role: 'lead',
          },
        ],
      });
    });
  });

  describe('getProductivityMetrics', () => {
    const userId = 'user-123';
    const query = { startDate: '2024-01-01', endDate: '2024-01-31' };

    it('should return productivity metrics', async () => {
      const mockUserProjects = [{ projectId: 'project-123' }];
      const mockBillableHours = { _sum: { duration: 3600 } };
      const mockTotalHours = { _sum: { duration: 7200 } };
      const mockWorkLogs = 5;
      const mockTimeSessions = 3;

      mockPrismaService.projectMember.findMany.mockResolvedValue(
        mockUserProjects,
      );
      mockPrismaService.workLog.aggregate
        .mockResolvedValueOnce(mockBillableHours)
        .mockResolvedValueOnce(mockTotalHours);
      mockPrismaService.workLog.count.mockResolvedValue(mockWorkLogs);
      mockPrismaService.timeSession.count.mockResolvedValue(mockTimeSessions);

      const result = await service.getProductivityMetrics(userId, query);

      expect(result).toEqual({
        totalHours: 2,
        billableHours: 1,
        billablePercentage: 50,
        totalWorkLogs: 5,
        completedTimeSessions: 3,
        averageSessionLength: 0.67,
        efficiency: 50,
      });
    });
  });
});
