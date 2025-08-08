import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('system.analytics')
  async getDashboardStats(@Request() req) {
    return this.analyticsService.getDashboardStats(req.user.id);
  }

  @Get('time-tracking')
  @ApiOperation({ summary: 'Get time tracking analytics' })
  @ApiResponse({ status: 200, description: 'Time tracking analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('system.analytics')
  async getTimeTrackingAnalytics(@Query() query: any, @Request() req) {
    return this.analyticsService.getTimeTrackingAnalytics(req.user.id, query);
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get project analytics' })
  @ApiResponse({ status: 200, description: 'Project analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('system.analytics')
  async getProjectAnalytics(@Query() query: any, @Request() req) {
    return this.analyticsService.getProjectAnalytics(req.user.id, query);
  }

  @Get('teams')
  @ApiOperation({ summary: 'Get team analytics' })
  @ApiResponse({ status: 200, description: 'Team analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('system.analytics')
  async getTeamAnalytics(@Query() query: any, @Request() req) {
    return this.analyticsService.getTeamAnalytics(req.user.id, query);
  }

  @Get('productivity')
  @ApiOperation({ summary: 'Get productivity metrics' })
  @ApiResponse({ status: 200, description: 'Productivity metrics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('system.analytics')
  async getProductivityMetrics(@Query() query: any, @Request() req) {
    return this.analyticsService.getProductivityMetrics(req.user.id, query);
  }
} 