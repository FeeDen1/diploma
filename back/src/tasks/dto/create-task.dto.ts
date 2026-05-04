import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { TaskType } from '../../../generated/prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Задание 1', description: 'Название задания' })
  @IsNotEmpty({ message: 'Название обязательно' })
  @IsString({ message: 'Должно быть строкой' })
  @MaxLength(200, { message: 'Не более 200 символов' })
  readonly title: string;

  @ApiProperty({ example: 'Описание задания...', description: 'Описание задания' })
  @IsNotEmpty({ message: 'Описание обязательно' })
  @IsString({ message: 'Должно быть строкой' })
  readonly description: string;

  @ApiPropertyOptional({ enum: TaskType, example: 'general', description: 'Тип задания' })
  @IsOptional()
  @IsEnum(TaskType, { message: 'Некорректный тип задания' })
  readonly type?: TaskType;

  @ApiProperty({ example: 10, description: 'Количество баллов' })
  @IsNotEmpty({ message: 'Баллы обязательны' })
  @IsInt({ message: 'Должно быть целым числом' })
  @Min(1, { message: 'Минимум 1 балл' })
  readonly points: number;

  @ApiPropertyOptional({ example: 'uuid', description: 'ID файла задания' })
  @IsOptional()
  @IsUUID('4', { message: 'Должен быть UUID' })
  readonly taskFileId?: string;
}
