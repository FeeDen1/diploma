import type { ReadGroupDto } from '../groups/types';

export type UserRole = 'student' | 'adapter' | 'admin';
export type UserStatus = 'pending' | 'active' | 'suspended';

export interface ReadUserDto {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  ratingTotal: number;
  spentPoints: number;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ChangeRoleDto {
  role: UserRole;
}

export interface SetAvatarDto {
  fileId: string;
}

export interface MyGroupsDto {
  memberOf: ReadGroupDto[];
  curatorOf: ReadGroupDto[];
}
