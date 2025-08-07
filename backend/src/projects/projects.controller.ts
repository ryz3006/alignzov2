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
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, RequirePermissions } from '../common/guards/permission.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @RequirePermissions('projects', 'create')
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    try {
      const userId = req.user.id;
      return await this.projectsService.create(createProjectDto, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create project',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @RequirePermissions('projects', 'read')
  async findAll(@Request() req) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      return await this.projectsService.findAll(userId, userRole);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch projects',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @RequirePermissions('projects', 'read')
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      return await this.projectsService.findOne(id, userId, userRole);
    } catch (error) {
      throw new HttpException(
        error.message || 'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id')
  @RequirePermissions('projects', 'update')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req,
  ) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      return await this.projectsService.update(id, updateProjectDto, userId, userRole);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update project',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @RequirePermissions('projects', 'delete')
  async remove(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      return await this.projectsService.remove(id, userId, userRole);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete project',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
} 