import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccessLevel } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'User access levels',
    example: ['TEAM', 'PROJECT'],
    required: false,
    enum: AccessLevel,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AccessLevel, { each: true })
  accessLevels?: AccessLevel[];
}
