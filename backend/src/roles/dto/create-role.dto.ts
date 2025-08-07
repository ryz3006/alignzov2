import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Unique role name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Display name for the role' })
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'Role description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Access level for the role',
    enum: ['FULL_ACCESS', 'PROJECT', 'TEAM', 'INDIVIDUAL'],
    default: 'INDIVIDUAL'
  })
  @IsOptional()
  @IsEnum(['FULL_ACCESS', 'PROJECT', 'TEAM', 'INDIVIDUAL'])
  level?: 'FULL_ACCESS' | 'PROJECT' | 'TEAM' | 'INDIVIDUAL';

  @ApiProperty({ description: 'Whether this is a system role', default: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({ description: 'Whether the role is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ 
    description: 'Array of permission IDs to assign to this role',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissions?: string[];
} 