import type { Direction } from '@shared/api/groups';
import type { User } from '../user/types';

export interface Group {
  id: string;
  name: string;
  year: number;
  direction: Direction;
  createdAt: Date;
}

export interface GroupDetail extends Group {
  members: User[];
  adapters: User[];
}

/**
 * Служебные группы, скрытые из пользовательских фильтров и рейтинга (но
 * доступные при регистрации — туда записываются кураторы). Совпадение по имени;
 * держим список здесь, чтобы менять в одном месте.
 */
export const HIDDEN_GROUP_NAMES: readonly string[] = ['Куратор'];

export function isHiddenGroup(group: { name: string }): boolean {
  return HIDDEN_GROUP_NAMES.includes(group.name);
}

export type { Direction };
