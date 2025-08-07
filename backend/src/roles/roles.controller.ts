import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, RequirePermissions } from '../common/guards/permission.guard';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions('roles', 'create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequirePermissions('roles', 'read')
  findAll(@Query('includePermissions') includePermissions?: boolean) {
    return this.rolesService.findAll(includePermissions);
  }

  @Get(':id')
  @RequirePermissions('roles', 'read')
  findOne(@Param('id') id: string, @Query('includePermissions') includePermissions?: boolean) {
    return this.rolesService.findOne(id, includePermissions);
  }

  @Patch(':id')
  @RequirePermissions('roles', 'update')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions('roles', 'delete')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @RequirePermissions('roles', 'manage')
  assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, assignPermissionsDto);
  }

  @Get(':id/permissions')
  @RequirePermissions('roles', 'read')
  getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }
} 