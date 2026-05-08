import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { DevicePlatform } from '../../generated/prisma/client';

interface UpsertInput {
  userId: string;
  expoToken: string;
  platform: DevicePlatform;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upsert по expoToken: один физический девайс не может одновременно
   * принадлежать двум юзерам, поэтому при перелогине под другим аккаунтом
   * запись просто перепривязывается.
   */
  async upsert({ userId, expoToken, platform }: UpsertInput): Promise<void> {
    await this.prisma.deviceToken.upsert({
      where: { expoToken },
      create: { userId, expoToken, platform, lastSeenAt: new Date() },
      update: { userId, platform, lastSeenAt: new Date() },
    });
  }

  async removeByToken(expoToken: string): Promise<void> {
    await this.prisma.deviceToken.deleteMany({ where: { expoToken } });
  }

  async findTokensByUserIds(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const rows = await this.prisma.deviceToken.findMany({
      where: { userId: { in: userIds } },
      select: { expoToken: true },
    });
    return rows.map((row) => row.expoToken);
  }
}
