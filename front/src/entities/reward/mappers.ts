import type {
  ReadRedemptionDto,
  ReadRewardDto,
} from '@shared/api/rewards';
import type { Reward, RewardOrder } from './types';

export function toRewardDomain(dto: ReadRewardDto): Reward {
  const archivedAt = dto.archivedAt ? new Date(dto.archivedAt) : null;
  return {
    id: dto.id,
    title: dto.title,
    price: dto.price,
    imageUrl: dto.imageUrl,
    archivedAt,
    isArchived: !!archivedAt,
    createdAt: new Date(dto.createdAt),
  };
}

export function toRewardOrderDomain(dto: ReadRedemptionDto): RewardOrder {
  return {
    id: dto.id,
    itemTitle: dto.itemTitle,
    itemPrice: dto.itemPrice,
    status: dto.status,
    imageUrl: dto.imageUrl,
    createdAt: new Date(dto.createdAt),
  };
}
