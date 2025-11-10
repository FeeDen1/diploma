import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh-токен' })
  @IsNotEmpty({ message: 'Refresh-токен обязателен' })
  @IsString({ message: 'Должно быть строкой' })
  readonly refreshToken: string;
}
