import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { S3Service } from '../s3/s3.service';
import { OtpService } from '../otp/otp.service';
import { OtpPendingDto } from './dto/otp-pending.dto';
import { UnauthorizedException } from '../common/exceptions/unauthorized.exception';
import { ForbiddenException } from '../common/exceptions/forbidden.exception';
import { UserStatus, UserRole } from '../../generated/prisma/client';

jest.mock('../common/utils/password.utils', () => ({
  comparePasswords: jest.fn(),
}));
import { comparePasswords } from '../common/utils/password.utils';

describe('AuthService.login', () => {
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokensRepository: jest.Mocked<RefreshTokensRepository>;
  let configService: jest.Mocked<ConfigService>;
  let s3Service: jest.Mocked<S3Service>;
  let otpService: jest.Mocked<OtpService>;
  let service: AuthService;

  const baseUser = {
    id: 'user-1',
    email: 'st1@student.spbu.ru',
    passwordHash: 'hash',
    role: UserRole.student,
    status: UserStatus.active,
    avatarFile: null,
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    } as unknown as jest.Mocked<JwtService>;
    refreshTokensRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokensRepository>;
    configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    } as unknown as jest.Mocked<ConfigService>;
    s3Service = {
      getPublicUrl: jest.fn(),
    } as unknown as jest.Mocked<S3Service>;
    otpService = {
      issueAndSend: jest.fn(),
    } as unknown as jest.Mocked<OtpService>;

    service = new AuthService(
      usersService,
      jwtService,
      refreshTokensRepository,
      configService,
      s3Service,
      otpService,
    );

    (comparePasswords as jest.Mock).mockReset();
    (configService.getOrThrow as jest.Mock).mockImplementation((key: string) =>
      key === 'JWT_REFRESH_EXPIRES_DAYS' ? '30' : 'secret',
    );
  });

  it('бросает 401, если пользователя нет', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'x@x', password: 'p' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('бросает 401 на неверном пароле', async () => {
    usersService.findByEmail.mockResolvedValue(baseUser as never);
    (comparePasswords as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ email: baseUser.email, password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('бросает 403 на suspended', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      status: UserStatus.suspended,
    } as never);
    (comparePasswords as jest.Mock).mockResolvedValue(true);

    await expect(
      service.login({ email: baseUser.email, password: 'p' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('возвращает OtpPendingDto + переотправляет код для pending', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      status: UserStatus.pending,
    } as never);
    (comparePasswords as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: baseUser.email,
      password: 'p',
    });

    expect(result).toBeInstanceOf(OtpPendingDto);
    expect(otpService.issueAndSend).toHaveBeenCalled();
  });

  it('не валит запрос, если переотправка кода упала из-за throttle', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      status: UserStatus.pending,
    } as never);
    (comparePasswords as jest.Mock).mockResolvedValue(true);
    otpService.issueAndSend.mockRejectedValue(new Error('throttle'));

    const result = await service.login({
      email: baseUser.email,
      password: 'p',
    });
    expect(result).toBeInstanceOf(OtpPendingDto);
  });

  it('выдаёт токены для active', async () => {
    usersService.findByEmail.mockResolvedValue(baseUser as never);
    (comparePasswords as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: baseUser.email,
      password: 'p',
    });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(refreshTokensRepository.create).toHaveBeenCalled();
  });
});
