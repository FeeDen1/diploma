import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddAdapterDto {
  @ApiProperty({ example: 'uuid', description: 'ID пользователя-куратора' })
  @IsUUID('4', { message: 'Должно быть UUID' })
  readonly userId: string;
}
