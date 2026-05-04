import { ApiProperty } from '@nestjs/swagger';
import { ReadUserDto } from '../../users/dto/read-user.dto';
import { GroupWithRelations } from '../groups.repository';

export class ReadGroupDetailDto {
  @ApiProperty({ example: 'uuid', description: 'Уникальный идентификатор' })
  readonly id: string;

  @ApiProperty({ example: 'ИС-21', description: 'Название группы' })
  readonly name: string;

  @ApiProperty({ example: 2025, description: 'Год набора' })
  readonly year: number;

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
      createdAt: group.createdAt,
      members: group.members.map((m) => ReadUserDto.fromEntity(m.user)),
      adapters: group.adapters.map((a) => ReadUserDto.fromEntity(a.user)),
    });
  }
}
