import { apiClient } from '../client';
import type {
  CreateRewardDto,
  ListRewardsQuery,
  ReadRedemptionDto,
  ReadRewardDto,
  UpdateRewardDto,
} from './types';

export const rewardsApi = {
  async list(query: ListRewardsQuery = {}): Promise<ReadRewardDto[]> {
    const { data } = await apiClient.get<ReadRewardDto[]>('/rewards', {
      params: query.includeArchived ? { includeArchived: 'true' } : {},
    });
    return data;
  },

  async create(dto: CreateRewardDto): Promise<ReadRewardDto> {
    const { data } = await apiClient.post<ReadRewardDto>('/rewards', dto);
    return data;
  },

  async update(id: string, dto: UpdateRewardDto): Promise<ReadRewardDto> {
    const { data } = await apiClient.patch<ReadRewardDto>(
      `/rewards/${id}`,
      dto,
    );
    return data;
  },

  async archive(id: string): Promise<void> {
    await apiClient.delete(`/rewards/${id}`);
  },

  async restore(id: string): Promise<ReadRewardDto> {
    const { data } = await apiClient.patch<ReadRewardDto>(
      `/rewards/${id}/restore`,
    );
    return data;
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
