import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { TaskCategory } from '../../../generated/prisma/client';
import {
  ACHIEVEMENT_STATUSES,
  type AchievementStatus,
} from './achievement-status';

export type TasksSort =
  | 'deadline'
  | 'newest'
  | 'oldest'
  | 'points-asc'
  | 'points-desc';

export const TASKS_SORTS: TasksSort[] = [
  'deadline',
  'newest',
  'oldest',
  'points-asc',
  'points-desc',
];

/**
 * Превращает query-параметр-список в массив. Параметр может прийти как
 * csv-строка ("a,b,c") или уже как массив (если повторён: ?x=a&x=b).
 * Пустые элементы отбрасываются.
 */
function toArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return undefined;
}

export class ListTasksQueryDto {
  @ApiPropertyOptional({
    description: 'Фильтр по категориям (csv): socialization,adaptation,...',
    isArray: true,
    enum: TaskCategory,
  })
  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsEnum(TaskCategory, { each: true, message: 'Некорректная категория' })
  readonly categories?: TaskCategory[];

  @ApiPropertyOptional({
    description:
      'Фильтр по состоянию (csv): available,pending,approved,rejected',
    isArray: true,
    enum: ACHIEVEMENT_STATUSES,
  })
  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsIn(ACHIEVEMENT_STATUSES, { each: true, message: 'Некорректное состояние' })
  readonly states?: AchievementStatus[];

  @ApiPropertyOptional({
    description: 'Только задания с дедлайном (expiresAt задан)',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  readonly temporalOnly?: boolean;

  @ApiPropertyOptional({
    enum: TASKS_SORTS,
    description:
      'Сортировка (засчитанные всегда уходят в конец). По умолчанию ' +
      'deadline — сначала задания с ближайшим сроком, бессрочные ниже.',
    default: 'deadline',
  })
  @IsOptional()
  @IsEnum(TASKS_SORTS, { message: 'Некорректная сортировка' })
  readonly sort?: TasksSort;

  @ApiPropertyOptional({ example: 20, description: 'Размер страницы (1..50)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit?: number;

  @ApiPropertyOptional({ example: 0, description: 'Смещение' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly offset?: number;

  @ApiPropertyOptional({
    description:
      'Включать архивные задания. Игнорируется для роли student (студенту архив не виден всегда).',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  readonly includeArchived?: boolean;
}
