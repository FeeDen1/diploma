import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Direction } from '../../../generated/prisma/client';

export class CreateGroupDto {
  @ApiProperty({ example: '26.Б03-ПУ', description: 'Название группы' })
  @IsNotEmpty({ message: 'Название обязательно' })
  @IsString({ message: 'Должно быть строкой' })
  @MaxLength(100, { message: 'Не более 100 символов' })
  readonly name: string;

  @ApiProperty({ example: 2026, description: 'Год набора' })
  @IsNotEmpty({ message: 'Год обязателен' })
  @IsInt({ message: 'Должно быть целым числом' })
  @Min(2000, { message: 'Год не может быть меньше 2000' })
  readonly year: number;

  @ApiProperty({
    enum: Direction,
    example: Direction.pmi,
    description: 'Направление',
  })
  @IsNotEmpty({ message: 'Направление обязательно' })
  @IsEnum(Direction, { message: 'Некорректное направление' })
  readonly direction: Direction;
}
