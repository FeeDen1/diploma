import { ApiProperty } from '@nestjs/swagger';
import { Direction } from '../../../generated/prisma/client';
import { ReadUserDto } from '../../users/dto/read-user.dto';
import { GroupWithRelations } from '../groups.repository';

export class ReadGroupDetailDto {
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

  @ApiProperty({ type: [ReadUserDto], description: 'Участники группы' })
  readonly members: ReadUserDto[];

  @ApiProperty({ type: [ReadUserDto], description: 'Кураторы группы' })
  readonly adapters: ReadUserDto[];

  static fromEntity(group: GroupWithRelations): ReadGroupDetailDto {
    return Object.assign(new ReadGroupDetailDto(), {
      id: group.id,
      name: group.name,
      year: group.year,
      direction: group.direction,
      createdAt: group.createdAt,
      members: group.members.map((member) =>
        ReadUserDto.fromEntity(member.user),
      ),
      adapters: group.adapters.map((adapter) =>
        ReadUserDto.fromEntity(adapter.user),
      ),
    });
  }
}
