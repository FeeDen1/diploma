import * as bcrypt from 'bcrypt';
import { OtpService } from './otp.service';
import { OtpRepository } from './otp.repository';
import { MailService } from '../mail/mail.service';
import { OtpPurpose } from '../../generated/prisma/client';
import { DomainValidationException } from '../common/exceptions/validation.exception';

describe('OtpService', () => {
  let otpRepository: jest.Mocked<OtpRepository>;
  let mailService: jest.Mocked<MailService>;
  let service: OtpService;

  beforeEach(() => {
    otpRepository = {
      findLatest: jest.fn(),
      findActive: jest.fn(),
      invalidateActive: jest.fn(),
      incrementAttempts: jest.fn(),
      markUsed: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<OtpRepository>;
    mailService = {
      sendOtpEmail: jest.fn(),
    } as unknown as jest.Mocked<MailService>;
    service = new OtpService(otpRepository, mailService);
  });

  describe('issueAndSend', () => {
    it('создаёт код, инвалидирует старые, отправляет письмо', async () => {
      otpRepository.findLatest.mockResolvedValue(null);

      await service.issueAndSend(
        'user-1',
        'st1@student.spbu.ru',
        OtpPurpose.email_verification,
      );

      expect(otpRepository.invalidateActive).toHaveBeenCalledWith(
        'user-1',
        OtpPurpose.email_verification,
      );
      expect(otpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          purpose: OtpPurpose.email_verification,
          maxAttempts: 5,
        }),
      );
      expect(mailService.sendOtpEmail).toHaveBeenCalledWith(
        'st1@student.spbu.ru',
        expect.stringMatching(/^\d{6}$/),
      );
    });

    it('бросает throttle, если предыдущий код моложе 60 секунд', async () => {
      otpRepository.findLatest.mockResolvedValue({
        createdAt: new Date(Date.now() - 30_000),
      } as never);

      await expect(
        service.issueAndSend(
          'user-1',
          'st1@student.spbu.ru',
          OtpPurpose.email_verification,
        ),
      ).rejects.toBeInstanceOf(DomainValidationException);

      expect(otpRepository.create).not.toHaveBeenCalled();
      expect(mailService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('пропускает throttle, если предыдущий код старше 60 секунд', async () => {
      otpRepository.findLatest.mockResolvedValue({
        createdAt: new Date(Date.now() - 65_000),
      } as never);

      await service.issueAndSend(
        'user-1',
        'st1@student.spbu.ru',
        OtpPurpose.email_verification,
      );

      expect(otpRepository.create).toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('бросает, если активного кода нет', async () => {
      otpRepository.findActive.mockResolvedValue(null);

      await expect(
        service.verify('user-1', OtpPurpose.email_verification, '123456'),
      ).rejects.toBeInstanceOf(DomainValidationException);
    });

    it('инвалидирует код и бросает при превышении лимита попыток', async () => {
      otpRepository.findActive.mockResolvedValue({
        id: 'otp-1',
        attempts: 5,
        maxAttempts: 5,
        codeHash: 'hash',
      } as never);

      await expect(
        service.verify('user-1', OtpPurpose.email_verification, '123456'),
      ).rejects.toBeInstanceOf(DomainValidationException);

      expect(otpRepository.markUsed).toHaveBeenCalledWith('otp-1');
    });

    it('инкрементит attempts и бросает на неверном коде', async () => {
      const codeHash = await bcrypt.hash('111111', 10);
      otpRepository.findActive.mockResolvedValue({
        id: 'otp-1',
        attempts: 1,
        maxAttempts: 5,
        codeHash,
      } as never);
      otpRepository.incrementAttempts.mockResolvedValue({
        attempts: 2,
        maxAttempts: 5,
      } as never);

      await expect(
        service.verify('user-1', OtpPurpose.email_verification, '999999'),
      ).rejects.toBeInstanceOf(DomainValidationException);

      expect(otpRepository.incrementAttempts).toHaveBeenCalledWith('otp-1');
      expect(otpRepository.markUsed).not.toHaveBeenCalled();
    });

    it('помечает использованным при верном коде', async () => {
      const codeHash = await bcrypt.hash('123456', 10);
      otpRepository.findActive.mockResolvedValue({
        id: 'otp-1',
        attempts: 0,
        maxAttempts: 5,
        codeHash,
      } as never);

      await service.verify('user-1', OtpPurpose.email_verification, '123456');

      expect(otpRepository.markUsed).toHaveBeenCalledWith('otp-1');
      expect(otpRepository.incrementAttempts).not.toHaveBeenCalled();
    });
  });
});
