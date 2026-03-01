import { apiClient } from '../client';
import type { LeaderboardQuery, LeaderboardResponseDto } from './types';

export const leaderboardApi = {
  async get(query: LeaderboardQuery = {}): Promise<LeaderboardResponseDto> {
    const { data } = await apiClient.get<LeaderboardResponseDto>('/leaderboard', {
      params: query,
    });
    return data;
  },
};
