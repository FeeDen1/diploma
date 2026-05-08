import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Direction } from '../../../generated/prisma/client';

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: '26.Б03-ПУ', description: 'Название группы' })
  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  @MaxLength(100, { message: 'Не более 100 символов' })
  readonly name?: string;

  @ApiPropertyOptional({ example: 2026, description: 'Год набора' })
  @IsOptional()
  @IsInt({ message: 'Должно быть целым числом' })
  @Min(2000, { message: 'Год не может быть меньше 2000' })
  readonly year?: number;

  @ApiPropertyOptional({ enum: Direction, description: 'Направление' })
  @IsOptional()
  @IsEnum(Direction, { message: 'Некорректное направление' })
  readonly direction?: Direction;
}
