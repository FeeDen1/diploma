import type { Direction } from '../../../shared/config/api';

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  direction: Direction;
  group: string;
  totalPoints: number;
  rank: number;
}

export interface LeaderboardFilters {
  direction?: Direction;
  group?: string;
}

