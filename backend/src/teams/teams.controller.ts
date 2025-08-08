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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, RequirePermissions } from '../common/guards/permission.guard';

@ApiTags('Teams')
@Controller('teams')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @RequirePermissions('teams', 'create')
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({
    status: 201,
    description: 'Team created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - team name already exists',
  })
  create(@Body() createTeamDto: CreateTeamDto, @Request() req) {
    // If organizationId is not provided, use the user's organization
    if (!createTeamDto.organizationId && req.user.organizationId) {
      createTeamDto.organizationId = req.user.organizationId;
    }
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @RequirePermissions('teams', 'read')
  @ApiOperation({ summary: 'Get all teams (permission-based access)' })
  @ApiResponse({
    status: 200,
    description: 'Teams retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  findAll(@Request() req) {
    return this.teamsService.findAll(req.user.id);
  }

  @Get(':id')
  @RequirePermissions('teams', 'read')
  @ApiOperation({ summary: 'Get team by ID' })
  @ApiResponse({
    status: 200,
    description: 'Team retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Team not found',
  })
  findOne(@Param('id') id: string, @Request() req) {
    return this.teamsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @RequirePermissions('teams', 'update')
  @ApiOperation({ summary: 'Update team' })
  @ApiResponse({
    status: 200,
    description: 'Team updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Team not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - team name already exists',
  })
  update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req,
  ) {
    return this.teamsService.update(id, updateTeamDto, req.user.id);
  }

  @Delete(':id')
  @RequirePermissions('teams', 'delete')
  @ApiOperation({ summary: 'Delete team' })
  @ApiResponse({
    status: 200,
    description: 'Team deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Team not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - team has active members or projects',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.teamsService.remove(id, req.user.id);
  }

  @Post(':id/members/:userId')
  @RequirePermissions('teams', 'update')
  @ApiOperation({ summary: 'Add member to team' })
  @ApiResponse({
    status: 201,
    description: 'Member added successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Team or user not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user is already a member',
  })
  addMember(
    @Param('id') teamId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.teamsService.addMember(teamId, userId, req.user.id);
  }

  @Delete(':id/members/:userId')
  @RequirePermissions('teams', 'update')
  @ApiOperation({ summary: 'Remove member from team' })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Team or membership not found',
  })
  removeMember(
    @Param('id') teamId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.teamsService.removeMember(teamId, userId, req.user.id);
  }
} 