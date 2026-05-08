import type {
  LeaderboardEntryDto,
  LeaderboardResponseDto,
} from '../../shared/api/leaderboard';
import type { LeaderboardData, LeaderboardEntry } from './types';

export function toLeaderboardEntry(dto: LeaderboardEntryDto): LeaderboardEntry {
  return {
    rank: dto.rank,
    userId: dto.userId,
    firstName: dto.firstName,
    lastName: dto.lastName,
    fullName: `${dto.firstName} ${dto.lastName}`.trim(),
    ratingTotal: dto.ratingTotal,
    direction: dto.direction,
    groupName: dto.groupName,
    avatarUrl: dto.avatarUrl,
  };
}

export function toLeaderboardDomain(dto: LeaderboardResponseDto): LeaderboardData {
  return {
    entries: dto.entries.map(toLeaderboardEntry),
    total: dto.total,
    limit: dto.limit,
    offset: dto.offset,
  };
}
