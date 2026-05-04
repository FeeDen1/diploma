import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'ИС-21', description: 'Название группы' })
  @IsNotEmpty({ message: 'Название обязательно' })
  @IsString({ message: 'Должно быть строкой' })
  @MaxLength(100, { message: 'Не более 100 символов' })
  readonly name: string;

  @ApiProperty({ example: 2025, description: 'Год набора' })
  @IsNotEmpty({ message: 'Год обязателен' })
  @IsInt({ message: 'Должно быть целым числом' })
  @Min(2000, { message: 'Год не может быть меньше 2000' })
  readonly year: number;
}
