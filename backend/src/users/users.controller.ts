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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, RequirePermissions } from '../common/guards/permission.guard';
import { PermissionService } from '../common/services/permission.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionService: PermissionService,
  ) {}

  @Post()
  @RequirePermissions('users', 'create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions('users', 'read')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async findAll(@Query('organizationId') organizationId?: string, @Request() req?: any) {
    return this.usersService.findAll(organizationId, req.user.id);
  }

  @Get('search')
  @RequirePermissions('users', 'read')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
  })
  async searchUsers(
    @Query('q') query: string,
    @Query('organizationId') organizationId?: string,
    @Request() req?: any,
  ) {
    const users = await this.usersService.searchUsers(query, organizationId);
    
    // Filter users based on permissions
    const filteredUsers = await this.permissionService.filterUsersByPermission(
      users,
      req.user.id,
      'users',
      'read'
    );
    
    return filteredUsers;
  }

  @Get('subordinates')
  @RequirePermissions('users', 'read')
  @ApiOperation({ summary: 'Get user subordinates' })
  @ApiResponse({
    status: 200,
    description: 'Subordinates retrieved successfully',
  })
  getSubordinates(@Request() req) {
    return this.usersService.getSubordinates(req.user.id);
  }

  @Get(':id')
  @RequirePermissions('users', 'read')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('id') id: string, @Request() req) {
    // Check if user can access this specific user
    const canAccess = await this.permissionService.canUserAccessUser(req.user.id, id, 'read');
    if (!canAccess) {
      throw new Error('Insufficient permissions to access this user');
    }
    
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions('users', 'update')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    // Check if user can access this specific user
    const canAccess = await this.permissionService.canUserAccessUser(req.user.id, id, 'update');
    if (!canAccess) {
      throw new Error('Insufficient permissions to update this user');
    }
    
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions('users', 'delete')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async remove(@Param('id') id: string, @Request() req) {
    // Check if user can access this specific user
    const canAccess = await this.permissionService.canUserAccessUser(req.user.id, id, 'delete');
    if (!canAccess) {
      throw new Error('Insufficient permissions to delete this user');
    }
    
    return this.usersService.remove(id);
  }

  @Post(':id/assign-manager/:managerId')
  @RequirePermissions('users', 'assign_manager')
  @ApiOperation({ summary: 'Assign manager to user' })
  @ApiResponse({
    status: 200,
    description: 'Manager assigned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User or manager not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async assignManager(
    @Param('id') id: string,
    @Param('managerId') managerId: string,
    @Request() req,
  ) {
    // Check if user can access this specific user
    const canAccess = await this.permissionService.canUserAccessUser(req.user.id, id, 'assign_manager');
    if (!canAccess) {
      throw new Error('Insufficient permissions to assign manager to this user');
    }
    
    return this.usersService.assignManager(id, managerId);
  }

  @Post(':id/remove-manager')
  @RequirePermissions('users', 'remove_manager')
  @ApiOperation({ summary: 'Remove manager from user' })
  @ApiResponse({
    status: 200,
    description: 'Manager removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async removeManager(@Param('id') id: string, @Request() req) {
    // Check if user can access this specific user
    const canAccess = await this.permissionService.canUserAccessUser(req.user.id, id, 'remove_manager');
    if (!canAccess) {
      throw new Error('Insufficient permissions to remove manager from this user');
    }
    
    return this.usersService.removeManager(id);
  }

  @Post(':id/roles')
  @RequirePermissions('users', 'assign_role')
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({
    status: 200,
    description: 'Role assigned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User or role not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async assignRole(
    @Param('id') id: string,
    @Body() body: { roleId: string },
    @Request() req,
  ) {
    // Check if user can access this specific user
    const canAccess = await this.permissionService.canUserAccessUser(req.user.id, id, 'assign_role');
    if (!canAccess) {
      throw new Error('Insufficient permissions to assign role to this user');
    }
    
    return this.usersService.assignRole(id, body.roleId);
  }

  @Delete(':id/roles/:roleId')
  @RequirePermissions('users', 'remove_role')
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiResponse({
    status: 200,
    description: 'Role removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User or role not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async removeRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Request() req,
  ) {
    // Check if user can access this specific user
    const canAccess = await this.permissionService.canUserAccessUser(req.user.id, id, 'remove_role');
    if (!canAccess) {
      throw new Error('Insufficient permissions to remove role from this user');
    }
    
    return this.usersService.removeRole(id, roleId);
  }

  @Get(':id/roles')
  @RequirePermissions('users', 'read')
  @ApiOperation({ summary: 'Get user roles' })
  @ApiResponse({
    status: 200,
    description: 'User roles retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserRoles(@Param('id') id: string, @Request() req) {
    // Check if user can access this specific user
    const canAccess = await this.permissionService.canUserAccessUser(req.user.id, id, 'read');
    if (!canAccess) {
      throw new Error('Insufficient permissions to access this user');
    }
    
    return this.usersService.getUserRoles(id);
  }

  @Get('permissions/me')
  @ApiOperation({ summary: 'Get current user permissions' })
  @ApiResponse({
    status: 200,
    description: 'User permissions retrieved successfully',
  })
  async getMyPermissions(@Request() req) {
    const permissions = await this.permissionService.getUserPermissions(req.user.id);
    return { permissions };
  }

  @Get('permissions/me/users')
  @ApiOperation({ summary: 'Get current user permissions for users resource' })
  @ApiResponse({
    status: 200,
    description: 'User permissions for users resource retrieved successfully',
  })
  async getMyUserPermissions(@Request() req) {
    const permissions = await this.permissionService.getUserPermissionsByResource(req.user.id, 'users');
    return { permissions };
  }
} 