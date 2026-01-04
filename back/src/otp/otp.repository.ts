import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import type { EmailOtp, OtpPurpose } from '../../generated/prisma/client';

@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: Date;
    maxAttempts?: number;
  }): Promise<EmailOtp> {
    return this.prisma.emailOtp.create({ data });
  }

  /** Последний выпущенный код (для throttling resend'а). */
  async findLatest(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<EmailOtp | null> {
    return this.prisma.emailOtp.findFirst({
      where: { userId, purpose },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Активный (не использованный, не истёкший) код для проверки. */
  async findActive(
    userId: string,
    purpose: OtpPurpose,
    now: Date = new Date(),
  ): Promise<EmailOtp | null> {
    return this.prisma.emailOtp.findFirst({
      where: {
        userId,
        purpose,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Помечает все активные коды этого пользователя по purpose как использованные. */
  async invalidateActive(
    userId: string,
    purpose: OtpPurpose,
    at: Date = new Date(),
  ): Promise<void> {
    await this.prisma.emailOtp.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: at },
    });
  }

  async incrementAttempts(id: string): Promise<EmailOtp> {
    return this.prisma.emailOtp.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async markUsed(id: string, at: Date = new Date()): Promise<EmailOtp> {
    return this.prisma.emailOtp.update({
      where: { id },
      data: { usedAt: at },
    });
  }
}
