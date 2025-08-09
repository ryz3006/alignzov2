import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    take?: number;
    cursor?: string | null;
    userId?: string | null;
    action?: string | null;
    entity?: string | null;
  }) {
    const { take = 50, cursor, userId, action, entity } = params;
    return this.prisma.auditLog.findMany({
      where: {
        userId: userId || undefined,
        action: action || undefined,
        entity: entity || undefined,
      },
      orderBy: { timestamp: 'desc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }

  async findMine(
    userId: string,
    params: { take?: number; cursor?: string | null },
  ) {
    const { take = 50, cursor } = params;
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }
}
