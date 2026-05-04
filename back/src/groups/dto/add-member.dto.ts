import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 'uuid', description: 'ID пользователя' })
  @IsUUID('4', { message: 'Должно быть UUID' })
  readonly userId: string;
}
