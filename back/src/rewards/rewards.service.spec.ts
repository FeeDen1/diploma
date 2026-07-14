import { RewardsService } from './rewards.service';
import {
  InsufficientFundsError,
  RewardsRepository,
  type RewardItemWithImage,
} from './rewards.repository';
import { FilesService } from '../files/files.service';
import { S3Service } from '../s3/s3.service';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { DomainValidationException } from '../common/exceptions/validation.exception';

describe('RewardsService', () => {
  let rewardsRepository: jest.Mocked<RewardsRepository>;
  let filesService: jest.Mocked<FilesService>;
  let s3Service: jest.Mocked<S3Service>;
  let service: RewardsService;

  const baseReward = {
    id: 'reward-1',
    title: 'Худи',
    price: 80,
    imageFileId: null,
    imageFile: null,
    archivedAt: null,
    createdAt: new Date(),
  } as unknown as RewardItemWithImage;

  beforeEach(() => {
    rewardsRepository = {
      findById: jest.fn(),
      redeem: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      unarchive: jest.fn(),
      findMyRedemptions: jest.fn(),
    } as unknown as jest.Mocked<RewardsRepository>;
    filesService = {
      assertOwnedAndType: jest.fn(),
    } as unknown as jest.Mocked<FilesService>;
    s3Service = {
      getPublicUrl: jest.fn(),
    } as unknown as jest.Mocked<S3Service>;
    service = new RewardsService(rewardsRepository, filesService, s3Service);
  });

  describe('redeem', () => {
    it('успешно оформляет заказ и делегирует репозиторию', async () => {
      rewardsRepository.findById.mockResolvedValue(baseReward);
      const fakeRedemption = {
        id: 'red-1',
        itemTitle: 'Худи',
        itemPrice: 80,
      };
      rewardsRepository.redeem.mockResolvedValue(fakeRedemption as never);

      const result = await service.redeem('user-1', 'reward-1');

      expect(rewardsRepository.redeem).toHaveBeenCalledWith({
        userId: 'user-1',
        rewardItemId: 'reward-1',
        itemTitle: 'Худи',
        itemPrice: 80,
      });
      expect(result).toBe(fakeRedemption);
    });

    it('бросает 404, если лот не существует', async () => {
      rewardsRepository.findById.mockResolvedValue(null);

      await expect(service.redeem('user-1', 'reward-1')).rejects.toBeInstanceOf(
        EntityNotFoundException,
      );
      expect(rewardsRepository.redeem).not.toHaveBeenCalled();
    });

    it('бросает 404, если лот в архиве', async () => {
      rewardsRepository.findById.mockResolvedValue({
        ...baseReward,
        archivedAt: new Date(),
      });

      await expect(service.redeem('user-1', 'reward-1')).rejects.toBeInstanceOf(
        EntityNotFoundException,
      );
      expect(rewardsRepository.redeem).not.toHaveBeenCalled();
    });

    it('конвертит InsufficientFundsError в DomainValidationException', async () => {
      rewardsRepository.findById.mockResolvedValue(baseReward);
      rewardsRepository.redeem.mockRejectedValue(
        new InsufficientFundsError(50, 80),
      );

      await expect(service.redeem('user-1', 'reward-1')).rejects.toBeInstanceOf(
        DomainValidationException,
      );
    });

    it('пробрасывает другие ошибки как есть', async () => {
      rewardsRepository.findById.mockResolvedValue(baseReward);
      const oops = new Error('db down');
      rewardsRepository.redeem.mockRejectedValue(oops);

      await expect(service.redeem('user-1', 'reward-1')).rejects.toBe(oops);
    });
  });

  describe('archiveReward', () => {
    it('идемпотентен: повторный архив не вызывает archive', async () => {
      rewardsRepository.findById.mockResolvedValue({
        ...baseReward,
        archivedAt: new Date(),
      });

      await service.archiveReward('reward-1');

      expect(rewardsRepository.archive).not.toHaveBeenCalled();
    });

    it('архивирует активный лот', async () => {
      rewardsRepository.findById.mockResolvedValue(baseReward);

      await service.archiveReward('reward-1');

      expect(rewardsRepository.archive).toHaveBeenCalledWith('reward-1');
    });
  });
});
