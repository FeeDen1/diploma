import { Injectable } from '@nestjs/common';
import { FileType } from '../../generated/prisma/client';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { DomainValidationException } from '../common/exceptions/validation.exception';
import { S3Service } from '../s3/s3.service';
import { FilesService } from '../files/files.service';
import {
  InsufficientFundsError,
  RewardsRepository,
  type RewardItemWithImage,
  type RewardRedemptionWithItem,
} from './rewards.repository';
import { CreateRewardDto } from './dto/create-reward.dto';

@Injectable()
export class RewardsService {
  constructor(
    private readonly rewardsRepository: RewardsRepository,
    private readonly filesService: FilesService,
    private readonly s3Service: S3Service,
  ) {}

  async listActive(): Promise<RewardItemWithImage[]> {
    return this.rewardsRepository.findActive();
  }

  async createReward(
    adminId: string,
    dto: CreateRewardDto,
  ): Promise<RewardItemWithImage> {
    if (dto.imageFileId) {
      await this.filesService.assertOwnedAndType(
        dto.imageFileId,
        adminId,
        FileType.reward,
      );
    }

    return this.rewardsRepository.create({
      title: dto.title.trim(),
      price: dto.price,
      imageFileId: dto.imageFileId ?? null,
    });
  }

  async archiveReward(id: string): Promise<void> {
    const reward = await this.rewardsRepository.findById(id);
    if (!reward) {
      throw new EntityNotFoundException('RewardItem', id);
    }
    if (reward.archivedAt) {
      // идемпотентность — повторное удаление не ошибка
      return;
    }
    await this.rewardsRepository.archive(id);
  }

  async redeem(
    userId: string,
    rewardId: string,
  ): Promise<RewardRedemptionWithItem> {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward || reward.archivedAt) {
      throw new EntityNotFoundException('RewardItem', rewardId);
    }

    try {
      return await this.rewardsRepository.redeem({
        userId,
        rewardItemId: reward.id,
        itemTitle: reward.title,
        itemPrice: reward.price,
      });
    } catch (err) {
      if (err instanceof InsufficientFundsError) {
        throw new DomainValidationException(err.message);
      }
      throw err;
    }
  }

  async listMyRedemptions(userId: string): Promise<RewardRedemptionWithItem[]> {
    return this.rewardsRepository.findMyRedemptions(userId);
  }

  /** URL обложки лота (если есть). */
  getImageUrl(reward: RewardItemWithImage): string | null {
    if (!reward.imageFile) return null;
    return this.s3Service.getPublicUrl(reward.imageFile.objectKey);
  }

  /**
   * URL обложки в snapshot-заказе. Если лот удалён или у него не было
   * картинки — null.
   */
  getRedemptionImageUrl(redemption: RewardRedemptionWithItem): string | null {
    const file = redemption.rewardItem?.imageFile;
    return file ? this.s3Service.getPublicUrl(file.objectKey) : null;
  }
}
