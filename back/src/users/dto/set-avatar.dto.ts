import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SetAvatarDto {
  @ApiProperty({ example: 'uuid', description: 'ID файла аватара' })
  @IsNotEmpty({ message: 'fileId обязателен' })
  @IsUUID('4', { message: 'fileId должен быть UUID' })
  readonly fileId: string;
}
