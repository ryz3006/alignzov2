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
import {
  PermissionGuard,
  RequirePermissions,
} from '../common/guards/permission.guard';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermissions('permissions', 'create')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @RequirePermissions('permissions', 'read')
  findAll(@Query('resource') resource?: string) {
    return this.permissionsService.findAll(resource);
  }

  @Get(':id')
  @RequirePermissions('permissions', 'read')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('permissions', 'update')
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermissions('permissions', 'delete')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }

  @Get('resources/list')
  @RequirePermissions('permissions', 'read')
  getResources() {
    return this.permissionsService.getResources();
  }

  @Get('actions/list')
  @RequirePermissions('permissions', 'read')
  getActions() {
    return this.permissionsService.getActions();
  }
}
