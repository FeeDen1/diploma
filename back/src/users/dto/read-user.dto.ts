import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole, UserStatus } from '../../../generated/prisma/client';

export class ReadUserDto {
  @ApiProperty({ example: 'uuid', description: 'Уникальный идентификатор' })
  readonly id: string;

  @ApiProperty({ example: 'user@mail.ru', description: 'Почтовый ящик' })
  readonly email: string;

  @ApiProperty({ enum: UserRole, example: 'student', description: 'Роль пользователя' })
  readonly role: UserRole;

  @ApiProperty({ enum: UserStatus, example: 'active', description: 'Статус пользователя' })
  readonly status: UserStatus;

  @ApiProperty({ example: 'Иван', description: 'Имя' })
  readonly firstName: string;

  @ApiProperty({ example: 'Иванов', description: 'Фамилия' })
  readonly lastName: string;

  @ApiProperty({ example: 0, description: 'Суммарный рейтинг' })
  readonly ratingTotal: number;

  @ApiPropertyOptional({ example: 'https://storage.yandexcloud.net/...', description: 'URL аватара', nullable: true })
  readonly avatarUrl: string | null;

  @ApiProperty({ description: 'Дата создания' })
  readonly createdAt: Date;

  static fromEntity(user: User, avatarUrl: string | null = null): ReadUserDto {
    return Object.assign(new ReadUserDto(), {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      firstName: user.firstName,
      lastName: user.lastName,
      ratingTotal: user.ratingTotal,
      avatarUrl,
      createdAt: user.createdAt,
    });
  }
}
