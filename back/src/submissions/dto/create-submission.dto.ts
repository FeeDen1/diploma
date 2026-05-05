import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'uuid', description: 'ID задания' })
  @IsNotEmpty({ message: 'ID задания обязателен' })
  @IsUUID('4', { message: 'Должно быть UUID' })
  readonly taskId: string;

  @ApiProperty({
    example: 'uuid',
    description: 'ID файла сдачи (обязательный)',
  })
  @IsNotEmpty({ message: 'Файл сдачи обязателен' })
  @IsUUID('4', { message: 'Должен быть UUID' })
  readonly submissionFileId: string;
}
