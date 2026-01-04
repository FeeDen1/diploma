import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Универсальный mail-сервис.
 *
 * Если в env заданы MAIL_HOST/PORT/USER/PASS — отправляем через nodemailer.
 * Если нет — пишем код в логи (удобно в dev без SMTP-аккаунта). Никаких
 * "тихих" падений: разработчик увидит OTP в консоли бэка.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST');
    this.fromAddress =
      this.config.get<string>('MAIL_FROM') ?? 'no-reply@pm-task.local';

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('MAIL_PORT') ?? 587),
        secure: this.config.get<string>('MAIL_SECURE') === 'true',
        auth: {
          user: this.config.get<string>('MAIL_USER') ?? '',
          pass: this.config.get<string>('MAIL_PASS') ?? '',
        },
      });
    } else {
      this.transporter = null;
      this.logger.warn(
        'MAIL_HOST не задан — письма будут только логироваться в консоль (dev-режим).',
      );
    }
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    const subject = 'Подтверждение почты — PM-Task';
    const text = [
      'Здравствуйте!',
      '',
      `Ваш код подтверждения: ${code}`,
      '',
      'Код действует 10 минут. Если вы не запрашивали подтверждение,',
      'просто проигнорируйте это письмо.',
    ].join('\n');

    if (!this.transporter) {
      this.logger.warn(`[OTP DEV] Код для ${to}: ${code}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      text,
    });
  }
}
