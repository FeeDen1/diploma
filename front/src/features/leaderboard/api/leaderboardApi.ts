import { useQuery } from '@tanstack/react-query';
import { mockGetLeaderboard } from '../../../shared/api/mocks';
import type { LeaderboardFilters } from '../../../entities/leaderboard';

export function useLeaderboard(filters: LeaderboardFilters) {
  return useQuery({
    queryKey: ['leaderboard', filters],
    queryFn: () => mockGetLeaderboard(filters),
  });
}

