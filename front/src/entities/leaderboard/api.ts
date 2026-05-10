import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { queryKeys } from '@shared/api';
import {
  leaderboardApi,
  type LeaderboardSort,
} from '@shared/api/leaderboard';
import { toLeaderboardDomain } from './mappers';
import type { LeaderboardData, LeaderboardFilters } from './types';

interface UseLeaderboardOptions extends LeaderboardFilters {
  sort?: LeaderboardSort;
  limit?: number;
  offset?: number;
}

export function useLeaderboard(
  options: UseLeaderboardOptions = {},
): UseQueryResult<LeaderboardData> {
  return useQuery({
    queryKey: queryKeys.leaderboard.list(options),
    queryFn: () => leaderboardApi.get(options),
    select: toLeaderboardDomain,
    // При перелистывании страницы держим предыдущие данные —
    // не моргаем спиннером и таблица плавно меняется.
    placeholderData: keepPreviousData,
  });
}
