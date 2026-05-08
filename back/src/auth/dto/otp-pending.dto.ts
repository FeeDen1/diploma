import { ApiProperty } from '@nestjs/swagger';

export class OtpPendingDto {
  @ApiProperty({ example: true, description: 'Признак pending-флоу' })
  readonly pending = true as const;

  @ApiProperty({ example: 'st106852@student.spbu.ru' })
  readonly email!: string;

  static of(email: string): OtpPendingDto {
    return Object.assign(new OtpPendingDto(), { email });
  }
}
