import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
// import { BullModule } from '@nestjs/bullmq';
import { AuditProducerService } from './audit.producer.service';
// import { AuditConsumerService } from './audit.consumer.service';
import { AuditIntegrityService } from './audit-integrity.service';
import { SiemModule } from '../siem/siem.module';

@Module({
  imports: [
    PrismaModule,
    SiemModule,
    // BullModule.registerQueue({
    //   name: 'audit-log',
    // }),
  ],
  providers: [
    AuditLogsService,
    AuditProducerService,
    // AuditConsumerService,
    AuditIntegrityService,
  ],
  controllers: [AuditLogsController],
  exports: [AuditLogsService, AuditProducerService],
})
export class AuditLogsModule {}
