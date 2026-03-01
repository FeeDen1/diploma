export type RedemptionStatus = 'pending' | 'fulfilled' | 'cancelled';

export const REDEMPTION_STATUS_LABELS: Record<RedemptionStatus, string> = {
  pending: 'В обработке',
  fulfilled: 'Выдан',
  cancelled: 'Отменён',
};

export interface ReadRewardDto {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface ReadRedemptionDto {
  id: string;
  itemTitle: string;
  itemPrice: number;
  status: RedemptionStatus;
  imageUrl: string | null;
  createdAt: string;
}

export interface CreateRewardDto {
  title: string;
  price: number;
  imageFileId?: string;
}
