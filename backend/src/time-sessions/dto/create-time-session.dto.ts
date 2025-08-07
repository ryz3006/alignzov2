import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';

export enum TimeSessionStatus {
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateTimeSessionDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsEnum(TimeSessionStatus)
  status?: TimeSessionStatus;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  taskCategory?: string;

  @IsOptional()
  @IsString()
  workCategory?: string;

  @IsOptional()
  @IsString()
  severityCategory?: string;

  @IsOptional()
  @IsString()
  sourceCategory?: string;

  @IsOptional()
  @IsString()
  ticketReference?: string;
} 