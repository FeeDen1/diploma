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

export type { Direction };
