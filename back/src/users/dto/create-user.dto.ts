import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@mail.ru', description: 'Почтовый ящик' })
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Некорректная почта' })
  readonly email: string;

  @ApiProperty({ example: 'password', description: 'Пароль' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Должно быть строкой' })
  @Length(8, 72, { message: 'От 8 до 72 символов' })
  readonly password: string;

  @ApiProperty({ example: 'Иван', description: 'Имя' })
  @IsNotEmpty({ message: 'Имя обязательно' })
  @IsString({ message: 'Должно быть строкой' })
  @MaxLength(50, { message: 'Не более 50 символов' })
  readonly firstName: string;

  @ApiProperty({ example: 'Иванов', description: 'Фамилия' })
  @IsNotEmpty({ message: 'Фамилия обязательна' })
  @IsString({ message: 'Должно быть строкой' })
  @MaxLength(50, { message: 'Не более 50 символов' })
  readonly lastName: string;
}
