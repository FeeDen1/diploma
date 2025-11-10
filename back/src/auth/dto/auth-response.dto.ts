import { ApiProperty } from '@nestjs/swagger';
import { ReadUserDto } from '../../users/dto/read-user.dto';
import { User } from '../../../generated/prisma/client';

export class AuthResponseDto {
  @ApiProperty({ description: 'Access-токен' })
  readonly accessToken: string;

  @ApiProperty({ description: 'Refresh-токен' })
  readonly refreshToken: string;

  @ApiProperty({ type: ReadUserDto, description: 'Данные пользователя' })
  readonly user: ReadUserDto;

  static create(
    accessToken: string,
    refreshToken: string,
    user: User & { avatarFile?: { objectKey: string } | null },
    avatarUrl: string | null = null,
  ): AuthResponseDto {
    return Object.assign(new AuthResponseDto(), {
      accessToken,
      refreshToken,
      user: ReadUserDto.fromEntity(user, avatarUrl),
    });
  }
}
