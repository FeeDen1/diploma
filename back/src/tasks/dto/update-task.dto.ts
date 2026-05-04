import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { TaskType } from '../../../generated/prisma/client';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Задание 1 (обновлено)', description: 'Название задания' })
  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  @MaxLength(200, { message: 'Не более 200 символов' })
  readonly title?: string;

  @ApiPropertyOptional({ example: 'Новое описание...', description: 'Описание задания' })
  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  readonly description?: string;

  @ApiPropertyOptional({ enum: TaskType, example: 'general', description: 'Тип задания' })
  @IsOptional()
  @IsEnum(TaskType, { message: 'Некорректный тип задания' })
  readonly type?: TaskType;

  @ApiPropertyOptional({ example: 15, description: 'Количество баллов' })
  @IsOptional()
  @IsInt({ message: 'Должно быть целым числом' })
  @Min(1, { message: 'Минимум 1 балл' })
  readonly points?: number;

  @ApiPropertyOptional({ example: 'uuid', description: 'ID файла задания (null для удаления)' })
  @IsOptional()
  @IsUUID('4', { message: 'Должен быть UUID' })
  readonly taskFileId?: string | null;
}
