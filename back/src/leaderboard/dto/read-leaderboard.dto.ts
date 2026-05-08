import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Direction } from '../../../generated/prisma/client';
import type { LeaderboardUser } from '../leaderboard.repository';

export class LeaderboardEntryDto {
  @ApiProperty({ example: 1, description: 'Позиция в общем рейтинге' })
  readonly rank: number;

  @ApiProperty({ example: 'uuid', description: 'ID пользователя' })
  readonly userId: string;

  @ApiProperty({ example: 'Иван', description: 'Имя' })
  readonly firstName: string;

  @ApiProperty({ example: 'Петров', description: 'Фамилия' })
  readonly lastName: string;

  @ApiProperty({ example: 350, description: 'Суммарный рейтинг' })
  readonly ratingTotal: number;

  @ApiPropertyOptional({
    enum: Direction,
    nullable: true,
    description: 'Направление группы',
  })
  readonly direction: Direction | null;

  @ApiPropertyOptional({
    example: '26.Б03-ПУ',
    nullable: true,
    description: 'Название группы',
  })
  readonly groupName: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'URL аватара' })
  readonly avatarUrl: string | null;
}

export class LeaderboardResponseDto {
  @ApiProperty({ type: [LeaderboardEntryDto] })
  readonly entries: LeaderboardEntryDto[];

  @ApiProperty({ example: 42, description: 'Всего записей с учётом фильтра' })
  readonly total: number;

  @ApiProperty({ example: 20, description: 'Лимит на страницу' })
  readonly limit: number;

  @ApiProperty({ example: 0, description: 'Смещение' })
  readonly offset: number;

  static create(
    users: LeaderboardUser[],
    total: number,
    limit: number,
    offset: number,
    avatarResolver: (user: LeaderboardUser) => string | null,
  ): LeaderboardResponseDto {
    const entries: LeaderboardEntryDto[] = users.map((user, index) => {
      const membership = user.groupMemberships[0]?.group ?? null;
      return {
        rank: offset + index + 1,
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        ratingTotal: user.ratingTotal,
        direction: membership?.direction ?? null,
        groupName: membership?.name ?? null,
        avatarUrl: avatarResolver(user),
      };
    });

    return Object.assign(new LeaderboardResponseDto(), {
      entries,
      total,
      limit,
      offset,
    });
  }
}
