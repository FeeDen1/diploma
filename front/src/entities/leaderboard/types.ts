import type { Direction } from '@shared/api/groups';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  ratingTotal: number;
  direction: Direction | null;
  groupName: string | null;
  avatarUrl: string | null;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface LeaderboardFilters {
  direction?: Direction;
  groupId?: string;
}
