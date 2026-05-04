import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: '22Б03', description: 'Название группы' })
  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  @MaxLength(100, { message: 'Не более 100 символов' })
  readonly name?: string;

  @ApiPropertyOptional({ example: 2026, description: 'Год набора' })
  @IsOptional()
  @IsInt({ message: 'Должно быть целым числом' })
  @Min(2000, { message: 'Год не может быть меньше 2000' })
  readonly year?: number;
}
