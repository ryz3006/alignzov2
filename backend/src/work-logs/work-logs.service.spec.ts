import { Test, TestingModule } from '@nestjs/testing';
import { WorkLogsService } from './work-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WorkLogsService', () => {
  let service: WorkLogsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    workLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    projectMember: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkLogsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WorkLogsService>(WorkLogsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createWorkLogDto = {
      projectId: 'project-123',
      description: 'Test work log',
      duration: 3600,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T10:00:00Z',
      isBillable: true,
      hourlyRate: 50,
      tags: ['test'],
    };

    const userId = 'user-123';

    it('should create a work log successfully', async () => {
      const mockProject = {
        id: 'project-123',
        ownerId: 'user-123',
        members: [],
      };

      const mockCreatedWorkLog = {
        id: 'worklog-123',
        ...createWorkLogDto,
        userId,
        startTime: new Date(createWorkLogDto.startTime),
        endTime: new Date(createWorkLogDto.endTime),
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        project: { id: 'project-123', name: 'Test Project', code: 'TEST' },
      };

      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.workLog.findMany.mockResolvedValue([]);
      mockPrismaService.workLog.create.mockResolvedValue(mockCreatedWorkLog);

      const result = await service.create(createWorkLogDto, userId);

      expect(result).toEqual(mockCreatedWorkLog);
      expect(mockPrismaService.workLog.create).toHaveBeenCalledWith({
        data: {
          ...createWorkLogDto,
          userId,
          startTime: new Date(createWorkLogDto.startTime),
          endTime: new Date(createWorkLogDto.endTime),
        },
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
          ticket: {
            select: {
              id: true,
              title: true,
              externalId: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.create(createWorkLogDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user has no access to project', async () => {
      const mockProject = {
        id: 'project-123',
        ownerId: 'other-user',
        members: [],
      };

      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      await expect(service.create(createWorkLogDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when time period overlaps', async () => {
      const mockProject = {
        id: 'project-123',
        ownerId: 'user-123',
        members: [],
      };

      const mockOverlappingLogs = [
        {
          id: 'existing-worklog',
          startTime: new Date('2024-01-15T09:30:00Z'),
          endTime: new Date('2024-01-15T10:30:00Z'),
        },
      ];

      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.workLog.findMany.mockResolvedValue(mockOverlappingLogs);

      await expect(service.create(createWorkLogDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    const userId = 'user-123';
    const query = { page: 1, limit: 20 };

    it('should return work logs with pagination', async () => {
      const mockWorkLogs = [
        {
          id: 'worklog-123',
          description: 'Test work log',
          user: { id: 'user-123', firstName: 'John', lastName: 'Doe' },
          project: { id: 'project-123', name: 'Test Project' },
        },
      ];

      const mockUserProjects = [{ projectId: 'project-123' }];

      mockPrismaService.projectMember.findMany.mockResolvedValue(
        mockUserProjects,
      );
      mockPrismaService.workLog.findMany.mockResolvedValue(mockWorkLogs);
      mockPrismaService.workLog.count.mockResolvedValue(1);

      const result = await service.findAll(userId, query);

      expect(result).toEqual({
        data: mockWorkLogs,
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });
  });

  describe('findOne', () => {
    const workLogId = 'worklog-123';
    const userId = 'user-123';

    it('should return a work log when found and user has access', async () => {
      const mockWorkLog = {
        id: workLogId,
        userId: 'user-123',
        projectId: 'project-123',
        description: 'Test work log',
        user: { id: 'user-123', firstName: 'John', lastName: 'Doe' },
        project: { id: 'project-123', name: 'Test Project' },
      };

      mockPrismaService.workLog.findUnique.mockResolvedValue(mockWorkLog);

      const result = await service.findOne(workLogId, userId);

      expect(result).toEqual(mockWorkLog);
    });

    it('should throw NotFoundException when work log not found', async () => {
      mockPrismaService.workLog.findUnique.mockResolvedValue(null);

      await expect(service.findOne(workLogId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user has no access', async () => {
      const mockWorkLog = {
        id: workLogId,
        userId: 'other-user',
        projectId: 'project-123',
      };

      mockPrismaService.workLog.findUnique.mockResolvedValue(mockWorkLog);
      mockPrismaService.projectMember.findFirst.mockResolvedValue(null);

      await expect(service.findOne(workLogId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    const workLogId = 'worklog-123';
    const userId = 'user-123';
    const updateWorkLogDto = {
      description: 'Updated work log',
    };

    it('should update a work log successfully', async () => {
      const mockWorkLog = {
        id: workLogId,
        userId: 'user-123',
        description: 'Original work log',
      };

      const mockUpdatedWorkLog = {
        ...mockWorkLog,
        ...updateWorkLogDto,
      };

      mockPrismaService.workLog.findUnique.mockResolvedValue(mockWorkLog);
      mockPrismaService.workLog.update.mockResolvedValue(mockUpdatedWorkLog);

      const result = await service.update(workLogId, updateWorkLogDto, userId);

      expect(result).toEqual(mockUpdatedWorkLog);
    });

    it('should throw BadRequestException when user is not the owner', async () => {
      const mockWorkLog = {
        id: workLogId,
        userId: 'other-user',
        description: 'Original work log',
      };

      mockPrismaService.workLog.findUnique.mockResolvedValue(mockWorkLog);

      await expect(
        service.update(workLogId, updateWorkLogDto, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const workLogId = 'worklog-123';
    const userId = 'user-123';

    it('should delete a work log successfully', async () => {
      const mockWorkLog = {
        id: workLogId,
        userId: 'user-123',
        description: 'Test work log',
      };

      mockPrismaService.workLog.findUnique.mockResolvedValue(mockWorkLog);
      mockPrismaService.workLog.delete.mockResolvedValue(mockWorkLog);

      const result = await service.remove(workLogId, userId);

      expect(result).toEqual(mockWorkLog);
    });

    it('should throw BadRequestException when user is not the owner', async () => {
      const mockWorkLog = {
        id: workLogId,
        userId: 'other-user',
        description: 'Test work log',
      };

      mockPrismaService.workLog.findUnique.mockResolvedValue(mockWorkLog);

      await expect(service.remove(workLogId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('approve', () => {
    const workLogId = 'worklog-123';
    const approverId = 'approver-123';

    it('should approve a work log successfully', async () => {
      const mockWorkLog = {
        id: workLogId,
        isApproved: false,
      };

      const mockApprovedWorkLog = {
        ...mockWorkLog,
        isApproved: true,
        approvedBy: approverId,
        approvedAt: expect.any(Date),
      };

      mockPrismaService.workLog.findUnique.mockResolvedValue(mockWorkLog);
      mockPrismaService.workLog.update.mockResolvedValue(mockApprovedWorkLog);

      const result = await service.approve(workLogId, approverId);

      expect(result).toEqual(mockApprovedWorkLog);
    });

    it('should throw NotFoundException when work log not found', async () => {
      mockPrismaService.workLog.findUnique.mockResolvedValue(null);

      await expect(service.approve(workLogId, approverId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAnalytics', () => {
    const userId = 'user-123';
    const query = { startDate: '2024-01-01', endDate: '2024-01-31' };

    it('should return analytics data', async () => {
      const mockUserProjects = [{ projectId: 'project-123' }];
      const mockTotalHours = { _sum: { duration: 7200 } };
      const mockTotalBillableHours = { _sum: { duration: 3600 } };
      const mockTotalWorkLogs = 2;
      const mockProjectStats = [
        {
          projectId: 'project-123',
          _sum: { duration: 7200 },
          _count: { id: 2 },
        },
      ];

      mockPrismaService.projectMember.findMany.mockResolvedValue(
        mockUserProjects,
      );
      mockPrismaService.workLog.aggregate
        .mockResolvedValueOnce(mockTotalHours)
        .mockResolvedValueOnce(mockTotalBillableHours);
      mockPrismaService.workLog.count.mockResolvedValue(mockTotalWorkLogs);
      mockPrismaService.workLog.groupBy.mockResolvedValue(mockProjectStats);
      mockPrismaService.project.findUnique.mockResolvedValue({
        name: 'Test Project',
        code: 'TEST',
      });

      const result = await service.getAnalytics(userId, query);

      expect(result).toEqual({
        totalHours: 2,
        totalBillableHours: 1,
        totalWorkLogs: 2,
        projectStats: [
          {
            projectId: 'project-123',
            projectName: 'Test Project',
            projectCode: 'TEST',
            hours: 2,
            workLogs: 2,
          },
        ],
      });
    });
  });
});
