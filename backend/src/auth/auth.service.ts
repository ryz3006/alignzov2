import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/services/logger.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async validateFirebaseToken(idToken: string): Promise<any> {
    try {
      this.logger.debug('Validating Firebase token...');
      const decodedToken = await this.firebaseService.verifyIdToken(idToken);
      this.logger.logAuthEvent('Firebase token validated successfully', decodedToken.email);
      return decodedToken;
    } catch (error) {
      this.logger.error('Firebase token validation failed', error.stack, { error: error.message });
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async loginWithGoogleUser(googleUser: any): Promise<AuthResponseDto> {
    // First, validate if the user's email domain is registered
    const organization = await this.organizationsService.validateUserDomain(googleUser.email);
    
    if (!organization) {
      this.logger.warn('User attempted login with unauthorized domain', { 
        email: googleUser.email,
        domain: googleUser.email.split('@')[1]
      });
      throw new UnauthorizedException('Your organization is not registered in the system. Please contact your administrator.');
    }
    
    // Check if user exists in our database
    let user = await this.usersService.findByEmail(googleUser.email);
    
    if (!user) {
      // Create new user if they don't exist, but only if organization is valid
      const createUserDto: CreateUserDto = {
        email: googleUser.email,
        firstName: googleUser.firstName || '',
        lastName: googleUser.lastName || '',
        displayName: `${googleUser.firstName} ${googleUser.lastName}`.trim(),
        avatarUrl: googleUser.avatarUrl,
        isActive: true,
        emailVerified: true, // Google users are verified
        organizationId: organization.id, // Assign to the validated organization
      };
      
      user = await this.usersService.create(createUserDto);
    } else {
      // Update existing user's avatar if needed
      if (!user.avatar && googleUser.avatarUrl) {
        await this.usersService.update(user.id, { avatarUrl: googleUser.avatarUrl });
      }
      
      // Ensure user is assigned to the correct organization
      if (!user.organizationId || user.organizationId !== organization.id) {
        await this.organizationsService.assignUserToOrganization(user.id, organization.id);
        user.organizationId = organization.id;
      }
    }

    // Ensure user is not null at this point
    if (!user) {
      throw new UnauthorizedException('Failed to create or retrieve user');
    }

    // Check if user has proper role assignments (onboarding validation)
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id, isActive: true },
      include: { role: true }
    });

    if (userRoles.length === 0) {
      this.logger.warn('User has no role assignments', { 
        userId: user.id, 
        email: user.email 
      });
      throw new UnauthorizedException('Your account requires additional setup. Please contact your administrator for onboarding.');
    }

    // Generate JWT token
    const token = await this.generateToken(user);
    
    // Get primary role from userRoles
    const primaryRole = userRoles[0]?.role?.name || 'USER';
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatar || undefined,
        role: primaryRole,
        organizationId: user.organizationId || undefined,
      },
      token,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
    };
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponseDto> {
    this.logger.logAuthEvent('Starting Google login process...');
    const firebaseUser = await this.validateFirebaseToken(idToken);
    
    // First, validate if the user's email domain is registered
    const organization = await this.organizationsService.validateUserDomain(firebaseUser.email);
    
    if (!organization) {
      this.logger.warn('User attempted login with unauthorized domain', { 
        email: firebaseUser.email,
        domain: firebaseUser.email.split('@')[1]
      });
      throw new UnauthorizedException('Your organization is not registered in the system. Please contact your administrator.');
    }
    
    // Check if user exists in our database
    let user = await this.usersService.findByEmail(firebaseUser.email);
    
    if (!user) {
      // Create new user if they don't exist, but only if organization is valid
      const createUserDto: CreateUserDto = {
        email: firebaseUser.email,
        firstName: firebaseUser.name?.split(' ')[0] || '',
        lastName: firebaseUser.name?.split(' ').slice(1).join(' ') || '',
        displayName: firebaseUser.name,
        avatarUrl: firebaseUser.picture,
        isActive: true,
        emailVerified: firebaseUser.email_verified,
        organizationId: organization.id, // Assign to the validated organization
      };
      
      user = await this.usersService.create(createUserDto);
      
      // Assign SUPER_ADMIN role to riyas.siddikk@6dtech.co.in
      if (firebaseUser.email === 'riyas.siddikk@6dtech.co.in') {
        const superAdminRole = await this.prisma.role.findUnique({
          where: { name: 'SUPER_ADMIN' }
        });
        
        if (superAdminRole && user) {
          await this.prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: superAdminRole.id,
              isActive: true,
            }
          });
          
          // Fetch the user again to include the newly assigned role
          user = await this.usersService.findByEmail(firebaseUser.email);
          
          if (!user) {
            throw new UnauthorizedException('Failed to fetch user after role assignment');
          }
        }
      }
    } else {
      // Update existing user's avatar if needed
      if (!user.avatar && firebaseUser.picture) {
        await this.usersService.update(user.id, { avatarUrl: firebaseUser.picture });
      }
      
      // Ensure user is assigned to the correct organization
      if (!user.organizationId || user.organizationId !== organization.id) {
        await this.organizationsService.assignUserToOrganization(user.id, organization.id);
        user.organizationId = organization.id;
      }
      
      // Fetch the user again to ensure we have the latest data including roles
      user = await this.usersService.findByEmail(firebaseUser.email);
      
      if (!user) {
        throw new UnauthorizedException('Failed to fetch user data');
      }
    }

    // Ensure user is not null at this point
    if (!user) {
      throw new UnauthorizedException('Failed to create or retrieve user');
    }

    // Check if user has proper role assignments (onboarding validation)
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id, isActive: true },
      include: { role: true }
    });

    if (userRoles.length === 0) {
      this.logger.warn('User has no role assignments', { 
        userId: user.id, 
        email: user.email 
      });
      throw new UnauthorizedException('Your account requires additional setup. Please contact your administrator for onboarding.');
    }

    // Generate JWT token
    const token = await this.generateToken(user);
    
    // Get primary role from userRoles
    const primaryRole = userRoles[0]?.role?.name || 'USER';
    
    this.logger.debug('User roles after login', { 
      userId: user.id, 
      roles: userRoles.map(ur => ur.role.name),
      primaryRole 
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatar || undefined,
        role: primaryRole,
        organizationId: user.organizationId || undefined,
      },
      token,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    
    // For now, we'll use Firebase authentication
    // In the future, we can add local authentication as well
    throw new BadRequestException('Please use Google OAuth for authentication');
  }

  async refreshToken(userId: string): Promise<AuthResponseDto> {
    this.logger.logAuthEvent('Refreshing token', userId);
    
    const user = await this.usersService.findById(userId);
    if (!user) {
      this.logger.error('User not found for refresh token', undefined, { userId });
      throw new UnauthorizedException('User not found');
    }

    this.logger.debug('User found for refresh', { 
      userId: user.id, 
      roles: user.userRoles?.map(ur => ur.role.name) 
    });

    const token = await this.generateToken(user);
    
    // Get primary role from userRoles
    const primaryRole = user.userRoles?.[0]?.role?.name || 'USER';
    
    this.logger.logAuthEvent('Token refreshed successfully', user.id, { 
      email: user.email, 
      role: primaryRole 
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatar || undefined,
        role: primaryRole,
        organizationId: user.organizationId || undefined,
      },
      token,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
    };
  }

  async logout(userId: string): Promise<void> {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success
    return;
  }

  private async generateToken(user: any): Promise<string> {
    if (!user) {
      throw new UnauthorizedException('User is required to generate token');
    }
    
    // Get primary role from userRoles
    const primaryRole = user.userRoles?.[0]?.role?.name || 'USER';
    
    const payload = {
      sub: user.id,
      email: user.email,
      role: primaryRole,
      organizationId: user.organizationId || undefined,
    };

    this.logger.debug('Generating JWT token for user', { 
      id: user.id, 
      email: user.email, 
      role: primaryRole 
    });
    
    const token = this.jwtService.sign(payload);
    this.logger.debug('JWT token generated successfully', { 
      userId: user.id, 
      tokenLength: token.length 
    });
    
    return token;
  }

  async validateUser(userId: string): Promise<any> {
    this.logger.debug('Validating user', { userId });
    const user = await this.usersService.findById(userId);
    this.logger.debug('User validation result', { 
      userId, 
      found: !!user, 
      isActive: user?.isActive 
    });
    return user;
  }
} 