import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeSessionDto } from './create-time-session.dto';

export class UpdateTimeSessionDto extends PartialType(CreateTimeSessionDto) {}
