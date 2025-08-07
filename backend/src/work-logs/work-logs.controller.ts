import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkLogsService } from './work-logs.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('work-logs')
@ApiBearerAuth()
@Controller('work-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkLogsController {
  constructor(private readonly workLogsService: WorkLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new work log' })
  @ApiResponse({ status: 201, description: 'Work log created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('work_logs.create')
  async create(@Body() createWorkLogDto: CreateWorkLogDto, @Request() req) {
    return this.workLogsService.create(createWorkLogDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work logs with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Work logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('work_logs.read')
  async findAll(@Query() query: any, @Request() req) {
    return this.workLogsService.findAll(req.user.id, query);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get work logs analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('work_logs.read')
  async getAnalytics(@Query() query: any, @Request() req) {
    return this.workLogsService.getAnalytics(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific work log by ID' })
  @ApiResponse({ status: 200, description: 'Work log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Work log not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('work_logs.read')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.workLogsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a work log' })
  @ApiResponse({ status: 200, description: 'Work log updated successfully' })
  @ApiResponse({ status: 404, description: 'Work log not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('work_logs.update')
  async update(
    @Param('id') id: string,
    @Body() updateWorkLogDto: UpdateWorkLogDto,
    @Request() req,
  ) {
    return this.workLogsService.update(id, updateWorkLogDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a work log' })
  @ApiResponse({ status: 200, description: 'Work log deleted successfully' })
  @ApiResponse({ status: 404, description: 'Work log not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('work_logs.delete')
  async remove(@Param('id') id: string, @Request() req) {
    return this.workLogsService.remove(id, req.user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a work log' })
  @ApiResponse({ status: 200, description: 'Work log approved successfully' })
  @ApiResponse({ status: 404, description: 'Work log not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Permissions('work_logs.approve')
  async approve(@Param('id') id: string, @Request() req) {
    return this.workLogsService.approve(id, req.user.id);
  }
} 