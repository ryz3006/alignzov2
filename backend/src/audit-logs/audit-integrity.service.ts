import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class AuditIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async createDailyHashChain() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: today,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    let previousHash = '';
    for (const log of auditLogs) {
      const hash = createHash('sha256')
        .update(JSON.stringify(log) + previousHash)
        .digest('hex');
      previousHash = hash;
    }

    // Store the final hash in a separate table for verification
    await this.prisma.dailyAuditHash.create({
      data: {
        date: today,
        hash: previousHash,
      },
    });
  }
}
