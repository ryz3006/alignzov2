import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request) => {
          console.log('JWT Strategy: Checking for token in cookies:', request?.cookies?.jwt_token ? 'Found' : 'Not found');
          return request?.cookies?.jwt_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy: Validating payload:', { sub: payload.sub, email: payload.email, role: payload.role });
    
    const user = await this.authService.validateUser(payload.sub);
    
    if (!user) {
      console.error('JWT Strategy: User not found for ID:', payload.sub);
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      console.error('JWT Strategy: User account is inactive:', payload.sub);
      throw new UnauthorizedException('User account is inactive');
    }

    // Extract primary role from userRoles array
    const primaryRole = user.userRoles?.[0]?.role?.name || 'USER';
    
    console.log('JWT Strategy: User validated successfully:', { 
      id: user.id, 
      email: user.email, 
      primaryRole,
      userRoles: user.userRoles?.map(ur => ur.role.name) || []
    });
    
    return {
      id: user.id,
      email: user.email,
      role: primaryRole,
      organizationId: user.organizationId,
      isActive: user.isActive,
    };
  }
} 