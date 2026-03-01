import type { Direction } from '../groups/types';

export type LeaderboardSort =
  | 'rating-desc'
  | 'rating-asc'
  | 'name-asc'
  | 'name-desc';

export const LEADERBOARD_SORTS: LeaderboardSort[] = [
  'rating-desc',
  'rating-asc',
  'name-asc',
  'name-desc',
];

export const LEADERBOARD_SORT_LABELS: Record<LeaderboardSort, string> = {
  'rating-desc': 'По рейтингу ↓',
  'rating-asc': 'По рейтингу ↑',
  'name-asc': 'По имени А→Я',
  'name-desc': 'По имени Я→А',
};

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  ratingTotal: number;
  direction: Direction | null;
  groupName: string | null;
  avatarUrl: string | null;
}

export interface LeaderboardResponseDto {
  entries: LeaderboardEntryDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface LeaderboardQuery {
  direction?: Direction;
  groupId?: string;
  sort?: LeaderboardSort;
  limit?: number;
  offset?: number;
}
