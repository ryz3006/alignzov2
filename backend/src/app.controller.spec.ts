import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let prismaService: PrismaService;

  const mockAppService = {
    getHello: jest.fn(),
    getHealth: jest.fn(),
    getDatabaseHealth: jest.fn(),
    getSystemHealth: jest.fn(),
  };

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      mockAppService.getHello.mockReturnValue('Hello World!');
      expect(appController.getHello()).toBe('Hello World!');
      expect(mockAppService.getHello).toHaveBeenCalled();
    });
  });

  describe('health', () => {
    it('should return application health status', () => {
      const result = appController.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
    });
  });

  describe('databaseHealth', () => {
    it('should return database health status when healthy', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '1': 1 }]);

      const result = await appController.getDatabaseHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('database', 'connected');
      expect(result).toHaveProperty('timestamp');
      expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
    });

    it('should return error status when database is unhealthy', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error('Connection timeout'),
      );

      const result = await appController.getDatabaseHealth();

      expect(result).toHaveProperty('status', 'error');
      expect(result).toHaveProperty('database', 'disconnected');
      expect(result).toHaveProperty('error', 'Connection timeout');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('systemStatus', () => {
    it('should return system status information', () => {
      const result = appController.getSystemStatus();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('platform');
      expect(result).toHaveProperty('nodeVersion');
    });
  });
});
