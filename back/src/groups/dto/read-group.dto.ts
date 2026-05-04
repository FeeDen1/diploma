import { ApiProperty } from '@nestjs/swagger';
import { Group } from '../../../generated/prisma/client';

export class ReadGroupDto {
  @ApiProperty({ example: 'uuid', description: 'Уникальный идентификатор' })
  readonly id: string;

  @ApiProperty({ example: '22Б03', description: 'Название группы' })
  readonly name: string;

  @ApiProperty({ example: 2025, description: 'Год набора' })
  readonly year: number;

  @ApiProperty({ description: 'Дата создания' })
  readonly createdAt: Date;

  static fromEntity(group: Group): ReadGroupDto {
    return Object.assign(new ReadGroupDto(), {
      id: group.id,
      name: group.name,
      year: group.year,
      createdAt: group.createdAt,
    });
  }
}
