export type TaskType = 'general';

export type TaskCategory =
  | 'study'
  | 'sport'
  | 'outdoor'
  | 'teambuilding'
  | 'activism';

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  study: 'Учеба',
  sport: 'Спорт',
  outdoor: 'Активный отдых',
  teambuilding: 'Сплочение',
  activism: 'Активизм',
};

/** Короткие лейблы для компактных чипов */
export const TASK_CATEGORY_SHORT_LABELS: Record<TaskCategory, string> = {
  study: 'Учеба',
  sport: 'Спорт',
  outdoor: 'Отдых',
  teambuilding: 'Сплочение',
  activism: 'Активизм',
};

export const TASK_CATEGORIES: TaskCategory[] = [
  'study',
  'sport',
  'outdoor',
  'teambuilding',
  'activism',
];

/**
 * Статус задания с точки зрения конкретного студента. Вычисляется на бэке
 * (LEFT JOIN сабмишенов пользователя) и приходит в ReadTaskDto.list.
 */
export type AchievementStatus =
  | 'available'
  | 'pending'
  | 'approved'
  | 'rejected';

export const ACHIEVEMENT_STATUSES: AchievementStatus[] = [
  'available',
  'pending',
  'approved',
  'rejected',
];

export const ACHIEVEMENT_STATUS_LABELS: Record<AchievementStatus, string> = {
  available: 'Активные',
  pending: 'В рассмотрении',
  approved: 'Засчитанные',
  rejected: 'Отклонённые',
};

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
  /** Статус для текущего пользователя. null — эндпоинт не вычисляет статус. */
  status: AchievementStatus | null;
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

export type TasksSort =
  | 'deadline'
  | 'newest'
  | 'oldest'
  | 'points-asc'
  | 'points-desc';

export const TASKS_SORTS: TasksSort[] = [
  'deadline',
  'newest',
  'oldest',
  'points-asc',
  'points-desc',
];

export const TASKS_SORT_LABELS: Record<TasksSort, string> = {
  deadline: 'Сначала срочные',
  newest: 'Сначала новые',
  oldest: 'Сначала старые',
  'points-desc': 'Больше баллов',
  'points-asc': 'Меньше баллов',
};

export interface ListTasksQuery {
  /** Фильтр по категориям (мультиселект). Пустой массив — без фильтра. */
  categories?: TaskCategory[];
  /** Фильтр по состоянию задания для текущего пользователя (мультиселект). */
  states?: AchievementStatus[];
  /** Только задания с дедлайном (expiresAt задан). */
  temporalOnly?: boolean;
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
