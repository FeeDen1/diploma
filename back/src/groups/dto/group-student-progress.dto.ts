import { ApiProperty } from '@nestjs/swagger';
import { ReadUserDto } from '../../users/dto/read-user.dto';

export class SubmissionsBreakdownDto {
  @ApiProperty({ example: 3 })
  readonly pending: number;

  @ApiProperty({ example: 5 })
  readonly approved: number;

  @ApiProperty({ example: 1 })
  readonly rejected: number;

  @ApiProperty({ example: 9 })
  readonly total: number;
}

export class GroupStudentProgressDto {
  @ApiProperty({ type: ReadUserDto })
  readonly user: ReadUserDto;

  @ApiProperty({ type: SubmissionsBreakdownDto })
  readonly submissions: SubmissionsBreakdownDto;
}
