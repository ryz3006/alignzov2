import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async sync(lastSync: Date) {
    const users = await this.prisma.user.findMany({
      where: {
        updatedAt: {
          gt: lastSync,
        },
      },
    });

    const workLogs = await this.prisma.workLog.findMany({
      where: {
        updatedAt: {
          gt: lastSync,
        },
      },
    });

    return {
      users,
      workLogs,
    };
  }
}
