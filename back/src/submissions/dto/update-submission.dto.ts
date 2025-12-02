import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateSubmissionDto {
  @ApiProperty({
    example: 'uuid',
    description: 'ID нового файла-доказательства (заменит предыдущий)',
  })
  @IsNotEmpty({ message: 'Файл сдачи обязателен' })
  @IsUUID('4', { message: 'Должен быть UUID' })
  readonly submissionFileId: string;
}
