import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SiemService } from '../siem/siem.service';
import { LoggerService } from '../common/services/logger.service';

@Injectable()
@Processor('audit-log')
export class AuditConsumerService extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siemService: SiemService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { data } = job;
    
    try {
      // Write to database first
      const auditLog = await this.prisma.auditLog.create({ data });
      
      // Stream to SIEM with retry logic
      await this.streamToSiem(auditLog, 3);
      
      return auditLog;
    } catch (error) {
      this.logger.error(`Failed to process audit log: ${error.message}`, error.stack, {
        jobId: job.id,
        data: data,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Stream audit log to SIEM with retry logic
   */
  private async streamToSiem(auditLog: any, maxRetries: number = 3): Promise<void> {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        await this.siemService.streamAuditLog({
          id: auditLog.id,
          userId: auditLog.userId,
          action: auditLog.action,
          entity: auditLog.entity,
          entityId: auditLog.entityId,
          oldValues: auditLog.oldValues,
          newValues: auditLog.newValues,
          ipAddress: auditLog.ipAddress,
          userAgent: auditLog.userAgent,
          sessionId: auditLog.sessionId,
          metadata: auditLog.metadata,
          timestamp: auditLog.timestamp,
        });
        
        this.logger.log(`Audit log streamed to SIEM successfully`, {
          auditLogId: auditLog.id,
          action: auditLog.action,
          entity: auditLog.entity,
        });
        
        return; // Success, exit retry loop
      } catch (error) {
        retries++;
        
        this.logger.warn(`Failed to stream audit log to SIEM (attempt ${retries}/${maxRetries})`, {
          auditLogId: auditLog.id,
          error: error.message,
          retries,
        });
        
        if (retries >= maxRetries) {
          this.logger.error(`Failed to stream audit log to SIEM after ${maxRetries} attempts`, error.stack, {
            auditLogId: auditLog.id,
            error: error.message,
          });
          // Don't throw error to avoid failing the entire audit job
          return;
        }
        
        // Exponential backoff: wait 2^retries seconds
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
