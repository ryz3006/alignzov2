import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkLogDto {
  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Ticket ID' })
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @ApiProperty({ description: 'Work description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Duration in seconds' })
  @IsNumber()
  duration: number;

  @ApiProperty({ description: 'Start time' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End time' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Is billable' })
  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;

  @ApiPropertyOptional({ description: 'Hourly rate' })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Import source' })
  @IsOptional()
  @IsString()
  importSource?: string;

  @ApiPropertyOptional({ description: 'Import ID' })
  @IsOptional()
  @IsString()
  importId?: string;

  @ApiPropertyOptional({ description: 'Selected module from project' })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ description: 'Selected task category from project' })
  @IsOptional()
  @IsString()
  taskCategory?: string;

  @ApiPropertyOptional({ description: 'Selected work category from project' })
  @IsOptional()
  @IsString()
  workCategory?: string;

  @ApiPropertyOptional({
    description: 'Selected severity category from project',
  })
  @IsOptional()
  @IsString()
  severityCategory?: string;

  @ApiPropertyOptional({ description: 'Selected source category from project' })
  @IsOptional()
  @IsString()
  sourceCategory?: string;

  @ApiPropertyOptional({ description: 'Ticket reference ID or email subject' })
  @IsOptional()
  @IsString()
  ticketReference?: string;
}
