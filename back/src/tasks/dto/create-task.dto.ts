import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskCategory, TaskType } from '../../../generated/prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Задание 1', description: 'Название задания' })
  @IsNotEmpty({ message: 'Название обязательно' })
  @IsString({ message: 'Должно быть строкой' })
  @MaxLength(200, { message: 'Не более 200 символов' })
  readonly title: string;

  @ApiProperty({
    example: 'Описание задания...',
    description: 'Описание задания',
  })
  @IsNotEmpty({ message: 'Описание обязательно' })
  @IsString({ message: 'Должно быть строкой' })
  readonly description: string;

  @ApiPropertyOptional({
    enum: TaskType,
    example: 'general',
    description: 'Тип задания',
  })
  @IsOptional()
  @IsEnum(TaskType, { message: 'Некорректный тип задания' })
  readonly type?: TaskType;

  @ApiProperty({
    enum: TaskCategory,
    example: TaskCategory.adaptation,
    description: 'Категория задания',
  })
  @IsNotEmpty({ message: 'Категория обязательна' })
  @IsEnum(TaskCategory, { message: 'Некорректная категория' })
  readonly category: TaskCategory;

  @ApiProperty({ example: 10, description: 'Количество баллов' })
  @IsNotEmpty({ message: 'Баллы обязательны' })
  @IsInt({ message: 'Должно быть целым числом' })
  @Min(1, { message: 'Минимум 1 балл' })
  readonly points: number;

  @ApiPropertyOptional({ example: 'uuid', description: 'ID файла задания' })
  @IsOptional()
  @IsUUID('4', { message: 'Должен быть UUID' })
  readonly taskFileId?: string;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59Z',
    description:
      'Срок действия задания (ISO 8601). Если не указан — задание бессрочное',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'expiresAt должен быть ISO 8601 датой' })
  readonly expiresAt?: string;
}
