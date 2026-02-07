import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Direction } from '../../../generated/prisma/client';

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

export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    enum: Direction,
    description: 'Фильтр по направлению',
  })
  @IsOptional()
  @IsEnum(Direction, { message: 'Некорректное направление' })
  readonly direction?: Direction;

  @ApiPropertyOptional({ description: 'Фильтр по конкретной группе (uuid)' })
  @IsOptional()
  @IsUUID('4', { message: 'groupId должен быть UUID' })
  readonly groupId?: string;

  @ApiPropertyOptional({
    enum: LEADERBOARD_SORTS,
    description: 'Сортировка',
    default: 'rating-desc',
  })
  @IsOptional()
  @IsEnum(LEADERBOARD_SORTS, { message: 'Некорректная сортировка' })
  readonly sort?: LeaderboardSort;

  @ApiPropertyOptional({ example: 20, description: 'Лимит (1..100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit — целое число' })
  @Min(1, { message: 'limit ≥ 1' })
  @Max(100, { message: 'limit ≤ 100' })
  readonly limit?: number;

  @ApiPropertyOptional({ example: 0, description: 'Смещение' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset — целое число' })
  @Min(0, { message: 'offset ≥ 0' })
  readonly offset?: number;
}
