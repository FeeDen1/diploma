import type { ReadUserDto } from '@shared/api/users';
import type { User } from './types';

export function toUserDomain(dto: ReadUserDto): User {
  const spentPoints = dto.spentPoints ?? 0;
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    fullName: `${dto.firstName} ${dto.lastName}`.trim(),
    role: dto.role,
    status: dto.status,
    ratingTotal: dto.ratingTotal,
    spentPoints,
    availablePoints: Math.max(0, dto.ratingTotal - spentPoints),
    avatarUrl: dto.avatarUrl,
    createdAt: new Date(dto.createdAt),
  };
}
