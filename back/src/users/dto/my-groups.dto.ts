import { ApiProperty } from '@nestjs/swagger';
import { ReadGroupDto } from '../../groups/dto/read-group.dto';
import type { Group } from '../../../generated/prisma/client';

export class MyGroupsDto {
  @ApiProperty({
    type: [ReadGroupDto],
    description: 'Группы, в которых пользователь — участник',
  })
  readonly memberOf: ReadGroupDto[];

  @ApiProperty({
    type: [ReadGroupDto],
    description: 'Группы, которые пользователь курирует (для adapter)',
  })
  readonly curatorOf: ReadGroupDto[];

  static create(memberOf: Group[], curatorOf: Group[]): MyGroupsDto {
    return Object.assign(new MyGroupsDto(), {
      memberOf: memberOf.map((group) => ReadGroupDto.fromEntity(group)),
      curatorOf: curatorOf.map((group) => ReadGroupDto.fromEntity(group)),
    });
  }
}
