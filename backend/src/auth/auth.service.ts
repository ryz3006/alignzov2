import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/services/logger.service';
import { OrganizationsService } from '../organizations/organizations.service';

type UserWithRoles = User & { userRoles: { role: { name: string } }[] };

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
      const decodedToken = await this.firebaseService.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponseDto> {
    const firebaseUser = await this.validateFirebaseToken(idToken);
    const organization = await this.organizationsService.validateUserDomain(firebaseUser.email);
    if (!organization) {
      throw new UnauthorizedException('Your organization is not registered.');
    }

    let user: User | null = await this.usersService.findByEmail(firebaseUser.email);
    if (!user) {
      const createUserDto: CreateUserDto = {
        email: firebaseUser.email,
        firstName: firebaseUser.name?.split(' ')[0] || '',
        lastName: firebaseUser.name?.split(' ').slice(1).join(' ') || '',
        displayName: firebaseUser.name,
        avatarUrl: firebaseUser.picture,
        isActive: true,
        emailVerified: firebaseUser.email_verified,
        organizationId: organization.id,
      };
      user = await this.usersService.create(createUserDto);
    }

    if (!user) {
      throw new UnauthorizedException('Failed to create or retrieve user');
    }

    const userWithRoles = (await this.usersService.findById(
      user.id,
      user.id,
      { includeRoles: true },
    )) as UserWithRoles;
    if (!userWithRoles || !userWithRoles.userRoles || userWithRoles.userRoles.length === 0) {
      throw new UnauthorizedException('Your account requires additional setup. Please contact your administrator.');
    }

    const token = await this.generateToken(userWithRoles as UserWithRoles);
    const primaryRole = userWithRoles.userRoles[0]?.role?.name || 'USER';

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

  async refreshToken(userId: string): Promise<AuthResponseDto> {
    const user = (await this.usersService.findById(userId, userId, {
      includeRoles: true,
    })) as UserWithRoles;
    if (!user || !user.userRoles) {
      throw new UnauthorizedException('User not found');
    }

    const token = await this.generateToken(user as UserWithRoles);
    const primaryRole = user.userRoles[0]?.role?.name || 'USER';

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
  
  private async generateToken(user: UserWithRoles): Promise<string> {
    const primaryRole = user.userRoles[0]?.role?.name || 'USER';
    const payload = {
      sub: user.id,
      email: user.email,
      role: primaryRole,
      organizationId: user.organizationId,
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string): Promise<User> {
    return this.usersService.findById(userId, userId, { includeRoles: true });
  }
} 