import { Injectable } from '@nestjs/common';
import { Direction } from '../../generated/prisma/client';
import {
  LeaderboardFilters,
  LeaderboardRepository,
  LeaderboardUser,
} from './leaderboard.repository';
import { S3Service } from '../s3/s3.service';
import { LeaderboardResponseDto } from './dto/read-leaderboard.dto';

export interface LeaderboardQuery extends LeaderboardFilters {
  limit: number;
  offset: number;
}

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly leaderboardRepository: LeaderboardRepository,
    private readonly s3Service: S3Service,
  ) {}

  async getLeaderboard(
    query: LeaderboardQuery,
  ): Promise<LeaderboardResponseDto> {
    const { limit, offset, ...filters } = query;
    const { users, total } = await this.leaderboardRepository.findAndCount(
      filters,
      limit,
      offset,
    );

    return LeaderboardResponseDto.create(users, total, limit, offset, (user) =>
      this.resolveAvatarUrl(user),
    );
  }

  private resolveAvatarUrl(user: LeaderboardUser): string | null {
    if (!user.avatarFile) return null;
    return this.s3Service.getPublicUrl(user.avatarFile.objectKey);
  }

  // Утилиты для контроллера, чтобы не тащить enum в декораторы
  static readonly DEFAULT_LIMIT = 20;
  static readonly MAX_LIMIT = 100;

  static parseDirection(value: unknown): Direction | undefined {
    if (typeof value !== 'string') return undefined;
    return Object.values(Direction).includes(value as Direction)
      ? (value as Direction)
      : undefined;
  }
}
