import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/services/logger.service';

@Injectable()
export class AuditProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async addToAuditLog(data: any) {
    try {
      // For now, directly write to database without queue
      // TODO: Implement proper queue when BullMQ is available
      await this.prisma.auditLog.create({ data });
      this.logger.debug('Audit log created directly', { action: data.action, entity: data.entity });
    } catch (error) {
      this.logger.error('Failed to create audit log', error.stack, { 
        action: data.action, 
        entity: data.entity,
        error: error.message 
      });
    }
  }
}
