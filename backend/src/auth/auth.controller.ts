import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { User } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

type UserWithRoles = User & { userRoles: { role: { name: string } }[] };

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/google')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google OAuth' })
  async loginWithGoogle(
    @Body() googleLoginDto: GoogleLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogle(googleLoginDto.idToken);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiBearerAuth()
  async refreshToken(@Request() req): Promise<AuthResponseDto> {
    return this.authService.refreshToken(req.user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth()
  async logout(
    @Request() req,
    @Res() res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout?.(req.user.id);
    res?.clearCookie?.('jwt_token');
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user information' })
  @ApiBearerAuth()
  async getProfile(@Request() req): Promise<any> {
    const user = (await this.authService.validateUser(
      req.user.id,
    )) as UserWithRoles;
    const primaryRole = user.userRoles?.[0]?.role?.name || 'USER';
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
      token: req.headers?.authorization?.replace('Bearer ', '') || undefined,
      expiresIn: '24h',
    };
  }
}
