import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { AuthService } from '../auth.service';

type UserWithRoles = User & { userRoles: { role: { name: string } }[] };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = (await this.authService.validateUser(payload.sub)) as UserWithRoles;
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const primaryRole = user.userRoles?.[0]?.role?.name || 'USER';
    
    return {
      id: user.id,
      email: user.email,
      role: primaryRole,
      organizationId: user.organizationId,
      isActive: user.isActive,
    };
  }
}
