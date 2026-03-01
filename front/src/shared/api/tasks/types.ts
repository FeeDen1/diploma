export type TaskType = 'general';

export type TaskCategory = 'socialization' | 'adaptation' | 'self_realization';

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  socialization: 'Социализация',
  adaptation: 'Адаптация',
  self_realization: 'Самореализация',
};

/** Короткие лейблы для компактных чипов */
export const TASK_CATEGORY_SHORT_LABELS: Record<TaskCategory, string> = {
  socialization: 'Соц.',
  adaptation: 'Адапт.',
  self_realization: 'Самореал.',
};

export const TASK_CATEGORIES: TaskCategory[] = [
  'socialization',
  'adaptation',
  'self_realization',
];

export interface ReadTaskDto {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  category: TaskCategory;
  points: number;
  taskFileUrl: string | null;
  expiresAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  category: TaskCategory;
  points: number;
  taskFileId?: string;
  expiresAt?: string | null;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  category?: TaskCategory;
  points?: number;
  taskFileId?: string | null;
  expiresAt?: string | null;
}

export type TasksSort = 'newest' | 'oldest' | 'points-asc' | 'points-desc';

export const TASKS_SORTS: TasksSort[] = [
  'newest',
  'oldest',
  'points-asc',
  'points-desc',
];

export const TASKS_SORT_LABELS: Record<TasksSort, string> = {
  newest: 'Сначала новые',
  oldest: 'Сначала старые',
  'points-desc': 'Больше баллов',
  'points-asc': 'Меньше баллов',
};

export interface ListTasksQuery {
  category?: TaskCategory;
  sort?: TasksSort;
  limit?: number;
  offset?: number;
  /** Доступно только админу. Включить архивные задания в выдачу. */
  includeArchived?: boolean;
}

export interface PaginatedTasksDto {
  items: ReadTaskDto[];
  total: number;
  limit: number;
  offset: number;
}
