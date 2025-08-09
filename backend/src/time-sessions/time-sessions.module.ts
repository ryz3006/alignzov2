import { Module } from '@nestjs/common';
import { TimeSessionsService } from './time-sessions.service';
import { TimeSessionsController } from './time-sessions.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TimeSessionsController],
  providers: [TimeSessionsService, PrismaService],
  exports: [TimeSessionsService],
})
export class TimeSessionsModule {}
