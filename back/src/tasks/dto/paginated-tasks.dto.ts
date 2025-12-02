import { ApiProperty } from '@nestjs/swagger';
import { ReadTaskDto } from './read-task.dto';

export class PaginatedTasksDto {
  @ApiProperty({ type: [ReadTaskDto] })
  readonly items: ReadTaskDto[];

  @ApiProperty({ example: 134 })
  readonly total: number;

  @ApiProperty({ example: 20 })
  readonly limit: number;

  @ApiProperty({ example: 0 })
  readonly offset: number;

  static create(
    items: ReadTaskDto[],
    total: number,
    limit: number,
    offset: number,
  ): PaginatedTasksDto {
    return Object.assign(new PaginatedTasksDto(), {
      items,
      total,
      limit,
      offset,
    });
  }
}
