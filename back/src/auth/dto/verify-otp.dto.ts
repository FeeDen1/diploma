import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: 'st106852@student.spbu.ru' })
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsEmail({}, { message: 'Некорректная почта' })
  readonly email: string;

  @ApiProperty({ example: '123456', description: '6-значный код из письма' })
  @IsNotEmpty({ message: 'Код обязателен' })
  @IsString()
  @Length(6, 6, { message: 'Код должен быть из 6 цифр' })
  @Matches(/^\d{6}$/, { message: 'Код должен состоять только из цифр' })
  readonly code: string;
}
