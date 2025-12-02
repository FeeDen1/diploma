import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskCategory, TaskType } from '../../../generated/prisma/client';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    example: 'Задание 1 (обновлено)',
    description: 'Название задания',
  })
  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  @MaxLength(200, { message: 'Не более 200 символов' })
  readonly title?: string;

  @ApiPropertyOptional({
    example: 'Новое описание...',
    description: 'Описание задания',
  })
  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  readonly description?: string;

  @ApiPropertyOptional({
    enum: TaskType,
    example: 'general',
    description: 'Тип задания',
  })
  @IsOptional()
  @IsEnum(TaskType, { message: 'Некорректный тип задания' })
  readonly type?: TaskType;

  @ApiPropertyOptional({ enum: TaskCategory, description: 'Категория задания' })
  @IsOptional()
  @IsEnum(TaskCategory, { message: 'Некорректная категория' })
  readonly category?: TaskCategory;

  @ApiPropertyOptional({ example: 15, description: 'Количество баллов' })
  @IsOptional()
  @IsInt({ message: 'Должно быть целым числом' })
  @Min(1, { message: 'Минимум 1 балл' })
  readonly points?: number;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'ID файла задания (null для удаления)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Должен быть UUID' })
  readonly taskFileId?: string | null;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59Z',
    description: 'Срок действия (ISO 8601, null — снять ограничение)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'expiresAt должен быть ISO 8601 датой' })
  readonly expiresAt?: string | null;
}
