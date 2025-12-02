import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Task, TaskCategory, TaskType } from '../../../generated/prisma/client';

export class ReadTaskDto {
  @ApiProperty({ example: 'uuid', description: 'Уникальный идентификатор' })
  readonly id: string;

  @ApiProperty({ example: 'Задание 1', description: 'Название задания' })
  readonly title: string;

  @ApiProperty({
    example: 'Описание задания...',
    description: 'Описание задания',
  })
  readonly description: string;

  @ApiProperty({
    enum: TaskType,
    example: 'general',
    description: 'Тип задания',
  })
  readonly type: TaskType;

  @ApiProperty({
    enum: TaskCategory,
    example: TaskCategory.adaptation,
    description: 'Категория задания',
  })
  readonly category: TaskCategory;

  @ApiProperty({ example: 10, description: 'Количество баллов' })
  readonly points: number;

  @ApiPropertyOptional({
    example: 'https://storage.yandexcloud.net/...',
    description: 'URL файла задания',
    nullable: true,
  })
  readonly taskFileUrl: string | null;

  @ApiPropertyOptional({
    description: 'Срок действия задания (null — бессрочное)',
    nullable: true,
  })
  readonly expiresAt: Date | null;

  @ApiPropertyOptional({
    description: 'Дата архивации (null — активное)',
    nullable: true,
  })
  readonly archivedAt: Date | null;

  @ApiProperty({ description: 'Дата создания' })
  readonly createdAt: Date;

  static fromEntity(
    task: Task,
    taskFileUrl: string | null = null,
  ): ReadTaskDto {
    return Object.assign(new ReadTaskDto(), {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      category: task.category,
      points: task.points,
      taskFileUrl,
      expiresAt: task.expiresAt,
      archivedAt: task.archivedAt,
      createdAt: task.createdAt,
    });
  }
}
