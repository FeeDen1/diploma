import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RedemptionStatus } from '../../../generated/prisma/client';
import type { RewardRedemptionWithItem } from '../rewards.repository';

export class ReadRedemptionDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly itemTitle: string;

  @ApiProperty({ example: 80 })
  readonly itemPrice: number;

  @ApiProperty({ enum: RedemptionStatus })
  readonly status: RedemptionStatus;

  @ApiPropertyOptional({
    nullable: true,
    description: 'URL обложки лота, либо null если лот удалён или без фото',
  })
  readonly imageUrl: string | null;

  @ApiProperty()
  readonly createdAt: Date;

  static from(
    redemption: RewardRedemptionWithItem,
    imageUrl: string | null,
  ): ReadRedemptionDto {
    return Object.assign(new ReadRedemptionDto(), {
      id: redemption.id,
      itemTitle: redemption.itemTitle,
      itemPrice: redemption.itemPrice,
      status: redemption.status,
      imageUrl,
      createdAt: redemption.createdAt,
    });
  }
}
