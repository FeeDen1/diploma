import type { AchievementStatus, TaskCategory } from '@shared/api/tasks';

/**
 * Состояние фильтров ленты заданий. Все поля — мультиселект, чтобы
 * пользователь мог комбинировать категории и состояния произвольно.
 */
export interface AchievementFiltersValue {
  categories: TaskCategory[];
  states: AchievementStatus[];
  /** Только задания с дедлайном. */
  temporalOnly: boolean;
}

/** Пустые фильтры — выдача без ограничений. */
export const EMPTY_ACHIEVEMENT_FILTERS: AchievementFiltersValue = {
  categories: [],
  states: [],
  temporalOnly: false,
};

/** Количество активных фильтров — для бейджа на кнопке «Фильтры». */
export function countActiveFilters(value: AchievementFiltersValue): number {
  return (
    value.categories.length +
    value.states.length +
    (value.temporalOnly ? 1 : 0)
  );
}
