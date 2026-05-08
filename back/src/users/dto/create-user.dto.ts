import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const SPBU_STUDENT_EMAIL = /^st\d+@student\.spbu\.ru$/i;

export class CreateUserDto {
  @ApiProperty({
    example: 'st106852@student.spbu.ru',
    description: 'Студенческая почта СПбГУ',
  })
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Некорректная почта' })
  @Matches(SPBU_STUDENT_EMAIL, {
    message: 'Регистрация только по почте stXXXXXX@student.spbu.ru',
  })
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
