import { apiClient } from '../client';
import type {
  CreateRewardDto,
  ReadRedemptionDto,
  ReadRewardDto,
} from './types';

export const rewardsApi = {
  async list(): Promise<ReadRewardDto[]> {
    const { data } = await apiClient.get<ReadRewardDto[]>('/rewards');
    return data;
  },

  async create(dto: CreateRewardDto): Promise<ReadRewardDto> {
    const { data } = await apiClient.post<ReadRewardDto>('/rewards', dto);
    return data;
  },

  async archive(id: string): Promise<void> {
    await apiClient.delete(`/rewards/${id}`);
  },

  async redeem(id: string): Promise<ReadRedemptionDto> {
    const { data } = await apiClient.post<ReadRedemptionDto>(
      `/rewards/${id}/redeem`,
    );
    return data;
  },

  async myRedemptions(): Promise<ReadRedemptionDto[]> {
    const { data } = await apiClient.get<ReadRedemptionDto[]>(
      '/rewards/redemptions/my',
    );
    return data;
  },
};
