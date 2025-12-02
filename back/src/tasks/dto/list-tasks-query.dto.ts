import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { TaskCategory } from '../../../generated/prisma/client';

export type TasksSort = 'newest' | 'oldest' | 'points-asc' | 'points-desc';

export const TASKS_SORTS: TasksSort[] = [
  'newest',
  'oldest',
  'points-asc',
  'points-desc',
];

export class ListTasksQueryDto {
  @ApiPropertyOptional({
    enum: TaskCategory,
    description: 'Фильтр по категории',
  })
  @IsOptional()
  @IsEnum(TaskCategory, { message: 'Некорректная категория' })
  readonly category?: TaskCategory;

  @ApiPropertyOptional({
    enum: TASKS_SORTS,
    description: 'Сортировка',
    default: 'newest',
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
