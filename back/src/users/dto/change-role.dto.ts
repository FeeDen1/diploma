import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../../generated/prisma/client';

export class ChangeRoleDto {
  @ApiProperty({ enum: UserRole, example: 'adapter', description: 'Новая роль пользователя' })
  @IsEnum(UserRole, { message: 'Некорректная роль' })
  readonly role: UserRole;
}
