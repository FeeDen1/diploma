import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateRewardDto {
  @ApiPropertyOptional({
    example: 'Худи PM-Task',
    description: 'Название лота',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Не более 200 символов' })
  readonly title?: string;

  @ApiPropertyOptional({ example: 80, description: 'Цена в баллах' })
  @IsOptional()
  @IsInt({ message: 'Цена должна быть целым числом' })
  @Min(1, { message: 'Цена не меньше 1' })
  readonly price?: number;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'ID файла-обложки (null — убрать обложку)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'imageFileId должен быть UUID' })
  readonly imageFileId?: string | null;
}
