import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let firebaseService: FirebaseService;

  const mockAuthService = {
    validateFirebaseToken: jest.fn(),
    loginWithGoogle: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    generateJwtToken: jest.fn(),
    validateUser: jest.fn(),
  };

  const mockFirebaseService = {
    verifyIdToken: jest.fn(),
    isInitialized: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('loginWithGoogle', () => {
    it('should authenticate user with Google token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        userRoles: [
          {
            role: {
              id: '1',
              name: 'EMPLOYEE',
              displayName: 'Employee',
            },
          },
        ],
      };

      const mockToken = 'mock-jwt-token';

      mockAuthService.loginWithGoogle.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      const result = await controller.loginWithGoogle({
        idToken: 'mock-firebase-token',
      });

      expect(mockAuthService.loginWithGoogle).toHaveBeenCalledWith(
        'mock-firebase-token',
      );
      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh JWT token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      };

      const mockToken = 'new-jwt-token';

      mockAuthService.refreshToken.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      const result = await controller.refreshToken({ user: { id: '1' } });

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
      });
    });
  });

  describe('logout', () => {
    it('should clear JWT token cookie', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      };

      const result = await controller.logout(
        { user: { id: '1' } },
        mockResponse as any,
      );

      expect(mockAuthService.logout).toHaveBeenCalledWith('1');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('jwt_token');
      expect(result).toEqual({
        message: 'Logged out successfully',
      });
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        avatar: null,
        userRoles: [
          {
            role: {
              id: '1',
              name: 'EMPLOYEE',
              displayName: 'Employee',
            },
          },
        ],
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await controller.getProfile({
        user: { id: '1' },
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockAuthService.validateUser).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          avatarUrl: undefined,
          role: 'EMPLOYEE',
          organizationId: undefined,
        },
        token: 'test-token',
        expiresIn: '24h',
      });
    });
  });

  describe('getFirebaseStatus', () => {
    it('should return Firebase initialization status', async () => {
      // Mock the private firebaseService property
      Object.defineProperty(controller['authService'], 'firebaseService', {
        value: mockFirebaseService,
        writable: true,
      });

      mockFirebaseService.isInitialized.mockReturnValue(true);

      const result = await controller.getFirebaseStatus();

      expect(mockFirebaseService.isInitialized).toHaveBeenCalled();
      expect(result).toEqual({
        initialized: true,
        projectId: process.env.FIREBASE_PROJECT_ID || 'not-set',
      });
    });
  });

  describe('testUser', () => {
    it('should return user information for testing', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        userRoles: [
          {
            roleId: '1',
            role: {
              id: '1',
              name: 'EMPLOYEE',
              displayName: 'Employee',
            },
            isActive: true,
          },
        ],
      };

      // Mock the private usersService property
      Object.defineProperty(controller['authService'], 'usersService', {
        value: {
          findByEmail: jest.fn().mockResolvedValue(mockUser),
        },
        writable: true,
      });

      const result = await controller.testUser('test@example.com');

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        userRoles: [
          {
            roleId: '1',
            roleName: 'EMPLOYEE',
            isActive: true,
          },
        ],
      });
    });

    it('should handle user not found', async () => {
      // Mock the private usersService property
      Object.defineProperty(controller['authService'], 'usersService', {
        value: {
          findByEmail: jest.fn().mockResolvedValue(null),
        },
        writable: true,
      });

      const result = await controller.testUser('nonexistent@example.com');

      expect(result).toEqual({
        error: 'User not found',
      });
    });
  });
});
