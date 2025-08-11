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
  UseInterceptors,
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
import {
  PermissionGuard,
  RequirePermissions,
} from '../common/guards/permission.guard';
import { PermissionService } from '../common/services/permission.service';
import { PaginationInterceptor } from '../common/interceptors/pagination.interceptor';
import { EtagInterceptor } from '../common/interceptors/etag.interceptor';
import { CachingInterceptor } from '../common/interceptors/caching.interceptor';
import { Audit } from '../common/decorators/audit.decorator';

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
  @Audit({ entity: 'User' })
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions('users', 'read')
  @UseInterceptors(CachingInterceptor, PaginationInterceptor, EtagInterceptor)
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'organizationId', required: false })
  async findAll(
    @Query('organizationId') organizationId?: string,
    @Request() req?: any,
  ) {
    const users = await this.usersService.findAll(organizationId, req.user.id);
    return { users };
  }

  @Get('permissions/me')
  @ApiOperation({ summary: 'Get current user permissions' })
  getMyPermissions(@Request() req: any) {
    return this.permissionService
      .getUserPermissions(req.user.id)
      .then((permissions) => ({ permissions }));
  }

  @Get('search')
  @RequirePermissions('users', 'read')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'organizationId', required: false })
  searchUsers(
    @Query('q') query: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.usersService.searchUsers(query, organizationId);
  }

  @Get('subordinates')
  @RequirePermissions('users', 'read')
  @ApiOperation({ summary: 'Get user subordinates' })
  getSubordinates(@Request() req) {
    return this.usersService.getSubordinates(req.user.id);
  }

  @Get(':id')
  @RequirePermissions('users', 'read')
  @UseInterceptors(CachingInterceptor, EtagInterceptor)
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findById(id, req.user.id);
  }

  @Patch(':id')
  @RequirePermissions('users', 'update')
  @Audit({ entity: 'User', entityIdParam: 'id' })
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions('users', 'delete')
  @Audit({ entity: 'User', entityIdParam: 'id' })
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user.id);
  }

  @Post(':id/assign-manager/:managerId')
  @RequirePermissions('users', 'assign_manager')
  @ApiOperation({ summary: 'Assign manager to user' })
  assignManager(
    @Param('id') id: string,
    @Param('managerId') managerId: string,
  ) {
    return this.usersService.assignManager(id, managerId);
  }

  @Post(':id/remove-manager')
  @RequirePermissions('users', 'remove_manager')
  @ApiOperation({ summary: 'Remove manager from user' })
  removeManager(@Param('id') id: string) {
    return this.usersService.removeManager(id);
  }

  @Post(':id/roles')
  @RequirePermissions('users', 'assign_role')
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(@Param('id') id: string, @Body() body: { roleId: string }) {
    return this.usersService.assignRole(id, body.roleId);
  }

  @Delete(':id/roles/:roleId')
  @RequirePermissions('users', 'remove_role')
  @ApiOperation({ summary: 'Remove role from user' })
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(id, roleId);
  }

  @Get(':id/roles')
  @RequirePermissions('users', 'read')
  @ApiOperation({ summary: 'Get user roles' })
  getUserRoles(@Param('id') id: string) {
    return this.usersService.getUserRoles(id);
  }
}
