import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@mail.ru', description: 'Почтовый ящик' })
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Некорректная почта' })
  readonly email: string;

  @ApiProperty({ example: 'password', description: 'Пароль' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Должно быть строкой' })
  readonly password: string;
}
