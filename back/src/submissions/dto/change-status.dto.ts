import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SubmissionStatus } from '../../../generated/prisma/client';

export class ChangeStatusDto {
  @ApiProperty({ enum: SubmissionStatus, example: 'approved', description: 'Новый статус' })
  @IsEnum(SubmissionStatus, { message: 'Некорректный статус' })
  readonly status: SubmissionStatus;
}
