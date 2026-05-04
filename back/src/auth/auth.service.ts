import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UnauthorizedException } from '../common/exceptions/unauthorized.exception';
import { comparePasswords } from '../common/utils/password.utils';
import { hashToken } from './utils/token-hash.utils';
import type { UserWithAvatar } from '../users/users.repository';
import { TokenPayload } from './interfaces/token-payload.interface';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {}

  async registration(dto: CreateUserDto): Promise<AuthResponseDto> {
    const user = await this.usersService.createUser(dto);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Некорректный email или пароль');
    }

    const passwordValid = await comparePasswords(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Некорректный email или пароль');
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
    const stored = await this.refreshTokensRepository.findByTokenHash(tokenHash);

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
    const days = parseInt(this.configService.getOrThrow('JWT_REFRESH_EXPIRES_DAYS'), 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.refreshTokensRepository.create(user.id, refreshTokenHash, expiresAt);

    const avatarUrl = user.avatarFile
      ? this.s3Service.getPublicUrl(user.avatarFile.objectKey)
      : null;

    return AuthResponseDto.create(accessToken, refreshToken, user, avatarUrl);
  }
}
