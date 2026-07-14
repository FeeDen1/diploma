import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListRewardsQueryDto {
  @ApiPropertyOptional({
    description:
      'Включать архивные лоты. Игнорируется для роли student/adapter — ' +
      'архив магазина виден только админу.',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  readonly includeArchived?: boolean;
}
