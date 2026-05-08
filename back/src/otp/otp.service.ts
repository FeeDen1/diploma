import { randomInt } from 'crypto';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { OtpPurpose } from '../../generated/prisma/client';
import { DomainValidationException } from '../common/exceptions/validation.exception';
import { MailService } from '../mail/mail.service';
import { OtpRepository } from './otp.repository';

/**
 * Параметры OTP. Меняй здесь, если потребуется тюнинг.
 */
const CODE_LENGTH = 6;
const TTL_MINUTES = 10;
const RESEND_THROTTLE_MS = 60_000;
const MAX_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class OtpService {
  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly mailService: MailService,
  ) {}

  /**
   * Сгенерировать новый код, заинвалидировать предыдущие активные,
   * сохранить хеш и отправить пользователю на email.
   */
  async issueAndSend(
    userId: string,
    email: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const latest = await this.otpRepository.findLatest(userId, purpose);
    if (latest) {
      const elapsed = Date.now() - latest.createdAt.getTime();
      if (elapsed < RESEND_THROTTLE_MS) {
        const wait = Math.ceil((RESEND_THROTTLE_MS - elapsed) / 1000);
        throw new DomainValidationException(
          `Запрашивать новый код можно раз в минуту. Подождите ${wait} с.`,
        );
      }
    }

    await this.otpRepository.invalidateActive(userId, purpose);

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60_000);

    await this.otpRepository.create({
      userId,
      purpose,
      codeHash,
      expiresAt,
      maxAttempts: MAX_ATTEMPTS,
    });

    await this.mailService.sendOtpEmail(email, code);
  }

  /**
   * Проверить код. При неуспехе — инкремент attempts. При успехе — markUsed.
   * Превышение attempts инвалидирует код полностью.
   */
  async verify(
    userId: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<void> {
    const otp = await this.otpRepository.findActive(userId, purpose);
    if (!otp) {
      throw new DomainValidationException(
        'Код не найден или истёк. Запросите новый.',
      );
    }

    if (otp.attempts >= otp.maxAttempts) {
      await this.otpRepository.markUsed(otp.id);
      throw new DomainValidationException(
        'Слишком много неверных попыток. Запросите новый код.',
      );
    }

    const matches = await bcrypt.compare(code, otp.codeHash);
    if (!matches) {
      const updated = await this.otpRepository.incrementAttempts(otp.id);
      const left = Math.max(updated.maxAttempts - updated.attempts, 0);
      throw new DomainValidationException(
        left > 0 ? `Неверный код. Осталось попыток: ${left}` : 'Неверный код.',
      );
    }

    await this.otpRepository.markUsed(otp.id);
  }

  private generateCode(): string {
    const min = 10 ** (CODE_LENGTH - 1);
    const max = 10 ** CODE_LENGTH;
    return randomInt(min, max).toString();
  }
}
