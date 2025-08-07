import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ description: 'Unique permission name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Display name for the permission' })
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'Permission description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Resource this permission applies to (e.g., users, projects)' })
  @IsString()
  resource: string;

  @ApiProperty({ description: 'Action this permission allows (e.g., create, read, update, delete)' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Whether this is a system permission', default: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
} 