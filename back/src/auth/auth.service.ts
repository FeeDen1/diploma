import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpPurpose, UserStatus } from '../../generated/prisma/client';
import { UsersService } from '../users/users.service';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { OtpPendingDto } from './dto/otp-pending.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UnauthorizedException } from '../common/exceptions/unauthorized.exception';
import { ForbiddenException } from '../common/exceptions/forbidden.exception';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { DomainValidationException } from '../common/exceptions/validation.exception';
import { comparePasswords } from '../common/utils/password.utils';
import { hashToken } from './utils/token-hash.utils';
import type { UserWithAvatar } from '../users/users.repository';
import { TokenPayload } from './interfaces/token-payload.interface';
import { S3Service } from '../s3/s3.service';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Регистрация — создаём user в pending, отправляем OTP, токены ещё не выдаём.
   * Активация и токены — после verifyOtp.
   */
  async registration(dto: CreateUserDto): Promise<OtpPendingDto> {
    const user = await this.usersService.createUser(dto);
    await this.otpService.issueAndSend(
      user.id,
      user.email,
      OtpPurpose.email_verification,
    );
    return OtpPendingDto.of(user.email);
  }

  /**
   * Подтверждение email и выдача токенов. Активирует пользователя.
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new EntityNotFoundException('User', dto.email);
    }

    await this.otpService.verify(
      user.id,
      OtpPurpose.email_verification,
      dto.code,
    );

    const activated =
      user.status === UserStatus.active
        ? user
        : await this.usersService.activate(user.id);

    return this.generateTokens(activated);
  }

  /**
   * Перевыпустить код. Если юзер уже активирован — отказ.
   */
  async resendOtp(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new EntityNotFoundException('User', email);
    }
    if (user.status === UserStatus.active) {
      throw new DomainValidationException('Аккаунт уже подтверждён');
    }
    await this.otpService.issueAndSend(
      user.id,
      user.email,
      OtpPurpose.email_verification,
    );
  }

  async login(dto: LoginDto): Promise<AuthResponseDto | OtpPendingDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Некорректный email или пароль');
    }

    const passwordValid = await comparePasswords(
      dto.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Некорректный email или пароль');
    }

    if (user.status === UserStatus.suspended) {
      throw new ForbiddenException('Аккаунт заблокирован');
    }

    // Если юзер не подтвердил email — отдаём pending-ответ, фронт ведёт его в OTP.
    // Параллельно перевыпускаем код (с учётом throttle), чтобы пользователь его получил.
    if (user.status === UserStatus.pending) {
      try {
        await this.otpService.issueAndSend(
          user.id,
          user.email,
          OtpPurpose.email_verification,
        );
      } catch {
        // Если не прошёл throttling — просто молчим, код уже отправлен недавно.
      }
      return OtpPendingDto.of(user.email);
    }

    return this.generateTokens(user);
  }

  async refresh(dto: RefreshDto): Promise<AuthResponseDto> {
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify<TokenPayload>(dto.refreshToken, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Невалидный refresh-токен');
    }

    const tokenHash = hashToken(dto.refreshToken);
    const stored =
      await this.refreshTokensRepository.findByTokenHash(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh-токен истёк или отозван');
    }

    await this.refreshTokensRepository.revokeById(stored.id);

    const user = await this.usersService.getUserById(payload.id);
    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokensRepository.revokeByUserId(userId);
  }

  private async generateTokens(user: UserWithAvatar): Promise<AuthResponseDto> {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
    });

    const refreshTokenHash = hashToken(refreshToken);
    const days = parseInt(
      this.configService.getOrThrow('JWT_REFRESH_EXPIRES_DAYS'),
      10,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.refreshTokensRepository.create(
      user.id,
      refreshTokenHash,
      expiresAt,
    );

    const avatarUrl = user.avatarFile
      ? this.s3Service.getPublicUrl(user.avatarFile.objectKey)
      : null;

    return AuthResponseDto.create(accessToken, refreshToken, user, avatarUrl);
  }
}
