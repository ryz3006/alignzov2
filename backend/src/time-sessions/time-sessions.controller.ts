import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { TimeSessionsService } from './time-sessions.service';
import { CreateTimeSessionDto } from './dto/create-time-session.dto';
import { UpdateTimeSessionDto } from './dto/update-time-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  PermissionGuard,
  RequirePermissions,
} from '../common/guards/permission.guard';

@Controller('time-sessions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TimeSessionsController {
  constructor(private readonly timeSessionsService: TimeSessionsService) {}

  @Post()
  @RequirePermissions('time_sessions', 'create')
  async create(
    @Body() createTimeSessionDto: CreateTimeSessionDto,
    @Request() req,
  ) {
    try {
      const userId = req.user.id;
      return await this.timeSessionsService.create(
        createTimeSessionDto,
        userId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create time session',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @RequirePermissions('time_sessions', 'read')
  async findAll(@Request() req, @Query() query: any) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      return await this.timeSessionsService.findAll(userId, userRole, query);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch time sessions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @RequirePermissions('time_sessions', 'read')
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      return await this.timeSessionsService.findOne(id, userId, userRole);
    } catch (error) {
      throw new HttpException(
        error.message || 'Time session not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id/pause')
  @RequirePermissions('time_sessions', 'update')
  async pause(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      return await this.timeSessionsService.pause(id, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to pause time session',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/resume')
  @RequirePermissions('time_sessions', 'update')
  async resume(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      return await this.timeSessionsService.resume(id, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to resume time session',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/stop')
  @RequirePermissions('time_sessions', 'update')
  async stop(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      return await this.timeSessionsService.stop(id, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to stop time session',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/convert-to-work-log')
  @RequirePermissions('time_sessions', 'update')
  async convertToWorkLog(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      return await this.timeSessionsService.convertToWorkLog(id, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to convert time session to work log',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id')
  @RequirePermissions('time_sessions', 'update')
  async update(
    @Param('id') id: string,
    @Body() updateTimeSessionDto: UpdateTimeSessionDto,
    @Request() req,
  ) {
    try {
      const userId = req.user.id;
      return await this.timeSessionsService.update(
        id,
        updateTimeSessionDto,
        userId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update time session',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @RequirePermissions('time_sessions', 'delete')
  async remove(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      return await this.timeSessionsService.remove(id, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete time session',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
