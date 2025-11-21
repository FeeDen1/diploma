import { ApiProperty } from '@nestjs/swagger';
import { Direction, Group } from '../../../generated/prisma/client';

export class ReadGroupDto {
  @ApiProperty({ example: 'uuid', description: 'Уникальный идентификатор' })
  readonly id: string;

  @ApiProperty({ example: '26.Б03-ПУ', description: 'Название группы' })
  readonly name: string;

  @ApiProperty({ example: 2026, description: 'Год набора' })
  readonly year: number;

  @ApiProperty({
    enum: Direction,
    example: Direction.pmi,
    description: 'Направление',
  })
  readonly direction: Direction;

  @ApiProperty({ description: 'Дата создания' })
  readonly createdAt: Date;

  static fromEntity(group: Group): ReadGroupDto {
    return Object.assign(new ReadGroupDto(), {
      id: group.id,
      name: group.name,
      year: group.year,
      direction: group.direction,
      createdAt: group.createdAt,
    });
  }
}
