import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DeviceSessionsService } from './device-sessions.service';
import { DeviceSessionsController } from './device-sessions.controller';

@Module({
  imports: [PrismaModule],
  providers: [DeviceSessionsService],
  controllers: [DeviceSessionsController],
  exports: [DeviceSessionsService],
})
export class DeviceSessionsModule {}
