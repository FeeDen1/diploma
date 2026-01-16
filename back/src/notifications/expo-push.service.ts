import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsRepository } from './notifications.repository';

const DEFAULT_EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export interface PushMessage {
  /** ExponentPushToken[...] */
  to: string;
  title: string;
  body: string;
  /** Произвольные данные — придут в data event на клиенте. */
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

interface ExpoTicketOk {
  status: 'ok';
  id: string;
}

interface ExpoTicketError {
  status: 'error';
  message: string;
  details?: { error?: string };
}

type ExpoTicket = ExpoTicketOk | ExpoTicketError;

interface ExpoResponse {
  data?: ExpoTicket[];
  errors?: { message: string }[];
}

/**
 * Тонкая обёртка над Expo Push API. Не подтягиваем expo-server-sdk, чтобы
 * не тащить зависимость ради одного POST-запроса. Батчим по 100 (лимит Expo)
 * и чистим из БД токены, которые Expo помечает как DeviceNotRegistered.
 */
@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly endpoint: string;
  private readonly accessToken: string | null;

  constructor(
    private readonly config: ConfigService,
    private readonly notificationsRepository: NotificationsRepository,
  ) {
    this.endpoint =
      this.config.get<string>('EXPO_PUSH_URL') ?? DEFAULT_EXPO_PUSH_URL;
    this.accessToken = this.config.get<string>('EXPO_ACCESS_TOKEN') ?? null;
  }

  async send(messages: PushMessage[]): Promise<void> {
    if (messages.length === 0) return;

    const batches = chunk(messages, BATCH_SIZE);
    for (const batch of batches) {
      await this.sendBatch(batch);
    }
  }

  private async sendBatch(messages: PushMessage[]): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    };
    // Опциональный personal access token Expo — повышает rate-limit на push.
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(messages),
      });
    } catch (err) {
      this.logger.error('Push request failed', err as Error);
      return;
    }

    if (!response.ok) {
      this.logger.warn(
        `Expo push returned ${response.status} ${response.statusText}`,
      );
      return;
    }

    let parsed: ExpoResponse;
    try {
      parsed = (await response.json()) as ExpoResponse;
    } catch {
      this.logger.warn('Не удалось разобрать ответ Expo Push API');
      return;
    }

    if (parsed.errors?.length) {
      this.logger.warn(
        `Expo push errors: ${parsed.errors.map((error) => error.message).join('; ')}`,
      );
    }

    if (!parsed.data) return;

    parsed.data.forEach((ticket, index) => {
      if (ticket.status !== 'error') return;

      const message = messages[index];
      const code = ticket.details?.error;
      this.logger.warn(
        `Push ticket error for ${message.to}: ${ticket.message}${
          code ? ` (${code})` : ''
        }`,
      );

      // Токен больше не валиден — удаляем, чтобы не слать впустую.
      if (
        code === 'DeviceNotRegistered' ||
        code === 'InvalidCredentials' ||
        code === 'MismatchSenderId'
      ) {
        void this.notificationsRepository.removeByToken(message.to);
      }
    });
  }
}

function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
