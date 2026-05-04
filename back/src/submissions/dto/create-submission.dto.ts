import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'uuid', description: 'ID задания' })
  @IsNotEmpty({ message: 'ID задания обязателен' })
  @IsUUID('4', { message: 'Должно быть UUID' })
  readonly taskId: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'ID файла сдачи' })
  @IsOptional()
  @IsUUID('4', { message: 'Должен быть UUID' })
  readonly submissionFileId?: string;
}
