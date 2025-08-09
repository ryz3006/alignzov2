import { Module } from '@nestjs/common';
import { UploadsService } from './Uploads.service';
import { UploadsController } from './Uploads.controller';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
