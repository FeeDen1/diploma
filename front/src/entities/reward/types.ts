import type { RedemptionStatus } from '@shared/api/rewards';

export interface Reward {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  createdAt: Date;
}

export interface RewardOrder {
  id: string;
  itemTitle: string;
  itemPrice: number;
  status: RedemptionStatus;
  imageUrl: string | null;
  createdAt: Date;
}

export type { RedemptionStatus };
