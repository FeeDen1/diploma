import type { ReadUserDto } from '../users/types';

export type Direction = 'pmi' | 'piit' | 'bd' | 'pkt';

export const DIRECTION_LABELS: Record<Direction, string> = {
  pmi: 'ПМИ',
  piit: 'ПИИТ',
  bd: 'БД',
  pkt: 'ПКТ',
};

export const DIRECTIONS: Direction[] = ['pmi', 'piit', 'bd', 'pkt'];

export interface ReadGroupDto {
  id: string;
  name: string;
  year: number;
  direction: Direction;
  createdAt: string;
}

export interface ReadGroupDetailDto extends ReadGroupDto {
  members: ReadUserDto[];
  adapters: ReadUserDto[];
}

export interface CreateGroupDto {
  name: string;
  year: number;
  direction: Direction;
}

export interface UpdateGroupDto {
  name?: string;
  year?: number;
  direction?: Direction;
}

export interface AddMemberDto {
  userId: string;
}

export interface AddAdapterDto {
  userId: string;
}

export interface GroupsListFilters {
  direction?: Direction;
}

export interface SubmissionsBreakdownDto {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface GroupStudentProgressDto {
  user: ReadUserDto;
  submissions: SubmissionsBreakdownDto;
}
