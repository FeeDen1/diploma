import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SubmissionStatus,
  TaskCategory,
} from '../../../generated/prisma/client';
import type { SubmissionWithRelations } from '../submissions.repository';

class MySubmissionTaskDto {
  @ApiProperty({ example: 'uuid' })
  readonly id: string;

  @ApiProperty({ example: 'Задание 1' })
  readonly title: string;

  @ApiProperty({ enum: TaskCategory })
  readonly category: TaskCategory;

  @ApiProperty({ example: 20 })
  readonly points: number;

  @ApiPropertyOptional({ nullable: true })
  readonly taskFileUrl: string | null;
}

/**
 * Компактный DTO для эндпоинта GET /submissions/my.
 * Не содержит блок student (это сам пользователь) и тяжёлых полей задачи
 * (description, type, временные метки) — клиенту они не нужны для списка.
 */
export class MySubmissionDto {
  @ApiProperty({ example: 'uuid' })
  readonly id: string;

  @ApiProperty({ enum: SubmissionStatus })
  readonly status: SubmissionStatus;

  @ApiPropertyOptional({ nullable: true })
  readonly submissionFileUrl: string | null;

  @ApiProperty({ type: MySubmissionTaskDto })
  readonly task: MySubmissionTaskDto;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  static fromEntity(
    submission: SubmissionWithRelations,
    urls: { submissionFileUrl: string | null; taskFileUrl: string | null },
  ): MySubmissionDto {
    return Object.assign(new MySubmissionDto(), {
      id: submission.id,
      status: submission.status,
      submissionFileUrl: urls.submissionFileUrl,
      task: {
        id: submission.task.id,
        title: submission.task.title,
        category: submission.task.category,
        points: submission.task.points,
        taskFileUrl: urls.taskFileUrl,
      },
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });
  }
}
