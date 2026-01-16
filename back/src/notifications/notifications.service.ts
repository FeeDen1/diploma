import { Injectable } from '@nestjs/common';
import { DevicePlatform } from '../../generated/prisma/client';
import { NotificationsRepository } from './notifications.repository';
import { ExpoPushService, type PushMessage } from './expo-push.service';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly expoPushService: ExpoPushService,
  ) {}

  async registerDevice(
    userId: string,
    expoToken: string,
    platform: DevicePlatform,
  ): Promise<void> {
    await this.notificationsRepository.upsert({
      userId,
      expoToken,
      platform,
    });
  }

  async unregisterDevice(expoToken: string): Promise<void> {
    await this.notificationsRepository.removeByToken(expoToken);
  }

  async notifyUser(userId: string, payload: PushPayload): Promise<void> {
    await this.notifyUsers([userId], payload);
  }

  /**
   * Шлёт уведомление всем девайсам всех указанных юзеров.
   * Никогда не бросает ошибку наружу — push не должен ломать основной flow.
   */
  async notifyUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (userIds.length === 0) return;

    const tokens =
      await this.notificationsRepository.findTokensByUserIds(userIds);
    if (tokens.length === 0) return;

    const messages: PushMessage[] = tokens.map((to) => ({
      to,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: 'default',
    }));

    await this.expoPushService.send(messages);
  }
}
