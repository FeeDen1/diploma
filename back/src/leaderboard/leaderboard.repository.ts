import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Direction, Prisma, UserStatus } from '../../generated/prisma/client';
import type { LeaderboardSort } from './dto/leaderboard-query.dto';

const INCLUDE_RELATIONS = {
  avatarFile: true,
  groupMemberships: {
    include: { group: true },
    orderBy: { joinedAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.UserInclude;

export type LeaderboardUser = Prisma.UserGetPayload<{
  include: typeof INCLUDE_RELATIONS;
}>;

export interface LeaderboardFilters {
  direction?: Direction;
  groupId?: string;
  sort?: LeaderboardSort;
}

const SORT_ORDER: Record<
  LeaderboardSort,
  Prisma.UserOrderByWithRelationInput[]
> = {
  'rating-desc': [{ ratingTotal: 'desc' }, { createdAt: 'asc' }],
  'rating-asc': [{ ratingTotal: 'asc' }, { createdAt: 'asc' }],
  'name-asc': [{ lastName: 'asc' }, { firstName: 'asc' }],
  'name-desc': [{ lastName: 'desc' }, { firstName: 'desc' }],
};

@Injectable()
export class LeaderboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAndCount(
    filters: LeaderboardFilters,
    limit: number,
    offset: number,
  ): Promise<{ users: LeaderboardUser[]; total: number; offset: number }> {
    const where = this.buildWhere(filters);
    const orderBy = SORT_ORDER[filters.sort ?? 'rating-desc'];

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: INCLUDE_RELATIONS,
        orderBy,
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, offset };
  }

  private buildWhere(filters: LeaderboardFilters): Prisma.UserWhereInput {
    // В лидерборд попадают только активные пользователи.
    // pending и suspended исключаем — это либо непрошедшие OTP, либо заблокированные.
    const where: Prisma.UserWhereInput = {
      status: UserStatus.active,
    };

    if (filters.groupId) {
      where.groupMemberships = { some: { groupId: filters.groupId } };
    } else if (filters.direction) {
      where.groupMemberships = {
        some: { group: { direction: filters.direction } },
      };
    }

    return where;
  }
}
