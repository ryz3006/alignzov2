import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RecordSessionDto {
  userId: string;
  deviceId: string;
  platform?: string;
  appVersion?: string;
  deviceName?: string;
  osVersion?: string;
}

@Injectable()
export class DeviceSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserSessions(userId: string) {
    return this.prisma.deviceSession.findMany({
      where: { 
        userId,
        isActive: true 
      },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        deviceId: true,
        platform: true,
        appVersion: true,
        deviceName: true,
        osVersion: true,
        lastUsedAt: true,
        createdAt: true,
        isActive: true,
      },
    });
  }

  async findSessionById(userId: string, sessionId: string) {
    const session = await this.prisma.deviceSession.findFirst({
      where: { 
        id: sessionId, 
        userId,
        isActive: true 
      },
    });

    if (!session) {
      throw new NotFoundException('Device session not found');
    }

    return session;
  }

  async recordSession(data: RecordSessionDto) {
    const { userId, deviceId, platform, appVersion, deviceName, osVersion } = data;

    return this.prisma.deviceSession.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      update: { 
        lastUsedAt: new Date(),
        platform,
        appVersion,
        deviceName,
        osVersion,
        isActive: true,
      },
      create: {
        userId,
        deviceId,
        platform,
        appVersion,
        deviceName,
        osVersion,
        isActive: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    // First check if session exists and belongs to user
    const session = await this.findSessionById(userId, sessionId);
    
    return this.prisma.deviceSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  async revokeAllSessions(userId: string) {
    return this.prisma.deviceSession.updateMany({
      where: { 
        userId,
        isActive: true 
      },
      data: { isActive: false },
    });
  }

  async cleanupInactiveSessions(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.prisma.deviceSession.deleteMany({
      where: {
        OR: [
          { isActive: false },
          { lastUsedAt: { lt: cutoffDate } }
        ]
      },
    });
  }

  async getSessionStats(userId: string) {
    const [totalSessions, activeSessions, platformBreakdown] = await Promise.all([
      this.prisma.deviceSession.count({ where: { userId } }),
      this.prisma.deviceSession.count({ where: { userId, isActive: true } }),
      this.prisma.deviceSession.groupBy({
        by: ['platform'],
        where: { userId, isActive: true },
        _count: { platform: true },
      }),
    ]);

    return {
      totalSessions,
      activeSessions,
      platformBreakdown,
    };
  }
}
