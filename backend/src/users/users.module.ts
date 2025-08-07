import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PermissionService } from '../common/services/permission.service';

@Module({
  imports: [PrismaModule, OrganizationsModule],
  controllers: [UsersController],
  providers: [UsersService, PermissionService],
  exports: [UsersService],
})
export class UsersModule {} 