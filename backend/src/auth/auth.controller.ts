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
  Req,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Email/password login disabled - only Google authentication is enabled
  // @Post('login')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Login with email and password' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User logged in successfully',
  //   type: AuthResponseDto,
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Invalid credentials',
  // })
  // async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
  //   return this.authService.login(loginDto);
  // }

  @Get('login/google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // This will redirect to Google OAuth
  }

  @Get('login/google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const googleUser = req.user;
      
      // Use the Google user data to authenticate
      const authResponse = await this.authService.loginWithGoogleUser(googleUser);
      
      // Set JWT token as HTTP-only cookie
      res.cookie('jwt_token', authResponse.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
      
      // Redirect to frontend dashboard
      res.redirect('http://localhost:3000/dashboard');
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('http://localhost:3000/login?error=auth_failed');
    }
  }

  @Post('login/google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google OAuth' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid token or organization not registered',
  })
  async loginWithGoogle(@Body() googleLoginDto: GoogleLoginDto): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogle(googleLoginDto.idToken);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid token',
  })
  async refreshToken(@Request() req): Promise<AuthResponseDto> {
    return this.authService.refreshToken(req.user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
  })
  async logout(@Request() req, @Res() res: Response): Promise<{ message: string }> {
    await this.authService.logout(req.user.id);
    
    // Clear the JWT cookie
    res.clearCookie('jwt_token');
    
    return { message: 'Logged out successfully' };
  }

  @Get('firebase-status')
  @ApiOperation({ summary: 'Check Firebase initialization status' })
  @ApiResponse({
    status: 200,
    description: 'Firebase status retrieved',
  })
  async getFirebaseStatus(): Promise<{ initialized: boolean; projectId: string }> {
    const isInitialized = this.authService['firebaseService'].isInitialized();
    const projectId = process.env.FIREBASE_PROJECT_ID || 'not-set';
    return { initialized: isInitialized, projectId };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user information' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Current user information retrieved',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(@Request() req): Promise<AuthResponseDto> {
    const user = await this.authService.validateUser(req.user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatar || undefined,
        role: user.userRoles?.[0]?.role?.name || 'USER',
        organizationId: undefined, // Will be set when user joins organization
      },
      token: req.headers.authorization?.replace('Bearer ', ''),
      expiresIn: '24h',
    };
  }

  @Get('test-user/:email')
  @ApiOperation({ summary: 'Test endpoint to check user roles' })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved',
  })
  async testUser(@Param('email') email: string) {
    const user = await this.authService['usersService'].findByEmail(email);
    if (!user) {
      return { error: 'User not found' };
    }
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      userRoles: user.userRoles?.map(ur => ({
        roleId: ur.roleId,
        roleName: ur.role.name,
        isActive: ur.isActive,
      })),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: 200,
    description: 'Current user information retrieved successfully',
  })
  async getCurrentUser(@Request() req) {
    return req.user;
  }
} 