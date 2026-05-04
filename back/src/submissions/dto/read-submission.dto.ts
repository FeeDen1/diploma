import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionStatus } from '../../../generated/prisma/client';
import { ReadUserDto } from '../../users/dto/read-user.dto';
import { ReadTaskDto } from '../../tasks/dto/read-task.dto';
import type { SubmissionWithRelations } from '../submissions.repository';

export class ReadSubmissionDto {
  @ApiProperty({ example: 'uuid', description: 'Уникальный идентификатор' })
  readonly id: string;

  @ApiProperty({ enum: SubmissionStatus, example: 'pending', description: 'Статус сдачи' })
  readonly status: SubmissionStatus;

  @ApiProperty({ type: ReadTaskDto, description: 'Задание' })
  readonly task: ReadTaskDto;

  @ApiProperty({ type: ReadUserDto, description: 'Студент' })
  readonly student: ReadUserDto;

  @ApiPropertyOptional({ example: 'https://storage.yandexcloud.net/...', description: 'URL файла сдачи', nullable: true })
  readonly submissionFileUrl: string | null;

  @ApiProperty({ description: 'Дата создания' })
  readonly createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  readonly updatedAt: Date;

  static fromEntity(
    submission: SubmissionWithRelations,
    urls: { submissionFileUrl?: string | null; taskFileUrl?: string | null; avatarUrl?: string | null } = {},
  ): ReadSubmissionDto {
    return Object.assign(new ReadSubmissionDto(), {
      id: submission.id,
      status: submission.status,
      task: ReadTaskDto.fromEntity(submission.task, urls.taskFileUrl ?? null),
      student: ReadUserDto.fromEntity(submission.student, urls.avatarUrl ?? null),
      submissionFileUrl: urls.submissionFileUrl ?? null,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });
  }
}
