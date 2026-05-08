import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({ example: 'Худи PM-Task', description: 'Название лота' })
  @IsNotEmpty({ message: 'Название обязательно' })
  @IsString()
  @MaxLength(200, { message: 'Не более 200 символов' })
  readonly title: string;

  @ApiProperty({ example: 80, description: 'Цена в баллах' })
  @IsInt({ message: 'Цена должна быть целым числом' })
  @Min(1, { message: 'Цена не меньше 1' })
  readonly price: number;

  @ApiPropertyOptional({ example: 'uuid', description: 'ID файла-обложки' })
  @IsOptional()
  @IsUUID('4', { message: 'imageFileId должен быть UUID' })
  readonly imageFileId?: string;
}
