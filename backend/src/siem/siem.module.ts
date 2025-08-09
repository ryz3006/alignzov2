import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SiemService } from './siem.service';

@Module({
  imports: [ConfigModule],
  providers: [SiemService],
  exports: [SiemService],
})
export class SiemModule {}
