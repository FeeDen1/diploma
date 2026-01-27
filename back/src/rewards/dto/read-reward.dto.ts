import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { RewardItemWithImage } from '../rewards.repository';

export class ReadRewardDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly title: string;

  @ApiProperty({ example: 80, description: 'Цена в баллах' })
  readonly price: number;

  @ApiPropertyOptional({ nullable: true })
  readonly imageUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly archivedAt: Date | null;

  @ApiProperty()
  readonly createdAt: Date;

  static from(
    reward: RewardItemWithImage,
    imageUrl: string | null,
  ): ReadRewardDto {
    return Object.assign(new ReadRewardDto(), {
      id: reward.id,
      title: reward.title,
      price: reward.price,
      imageUrl,
      archivedAt: reward.archivedAt,
      createdAt: reward.createdAt,
    });
  }
}
