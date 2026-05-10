import type { TaskCategory, TaskType } from '@shared/api/tasks';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  category: TaskCategory;
  points: number;
  coverUrl: string | null;
  expiresAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  isExpired: boolean;
  isArchived: boolean;
}

export type { TaskCategory, TaskType };
