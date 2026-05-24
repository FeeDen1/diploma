import { useMemo } from 'react';
import {
  flattenInfiniteTasks,
  useInfiniteTasks,
  type Task,
} from '@entities/task';
import { useMySubmissions, type MySubmission } from '@entities/submission';
import type { AchievementStatus, TasksSort } from '@shared/api/tasks';
import type { AchievementFiltersValue } from './filters';

export type { AchievementStatus };

export interface AchievementView extends Task {
  /** Статус приходит с бэка; available — если задание ещё не сдавалось. */
  status: AchievementStatus;
  submission?: MySubmission;
}

export interface UseAchievementsViewArgs {
  filters: AchievementFiltersValue;
  sort?: TasksSort;
}

export interface AchievementsViewResult {
  data: AchievementView[];
  total: number | null;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

/**
 * Соединяет постраничный fetch заданий с моими сдачами.
 *
 * Статус и сортировка («засчитанные — вниз») считаются на бэке, поэтому
 * клиент берёт status прямо из задания. Сдачи нужны лишь для режима
 * перезаливки отклонённой работы — отсюда submission рядом со статусом.
 */
export function useAchievementsView(
  args: UseAchievementsViewArgs,
): AchievementsViewResult {
  const tasksQuery = useInfiniteTasks({
    categories: args.filters.categories,
    states: args.filters.states,
    temporalOnly: args.filters.temporalOnly,
    sort: args.sort,
  });
  const submissionsQuery = useMySubmissions();

  const tasks = useMemo<Task[]>(
    () => flattenInfiniteTasks(tasksQuery.data),
    [tasksQuery.data],
  );

  const data = useMemo<AchievementView[]>(() => {
    const submissionByTaskId = new Map<string, MySubmission>();
    (submissionsQuery.data ?? []).forEach((submission) =>
      submissionByTaskId.set(submission.taskId, submission),
    );
    return tasks.map<AchievementView>((task) => ({
      ...task,
      status: task.status ?? 'available',
      submission: submissionByTaskId.get(task.id),
    }));
  }, [tasks, submissionsQuery.data]);

  const lastPage = tasksQuery.data?.pages.at(-1);
  const total = lastPage?.total ?? null;

  return {
    data,
    total,
    isLoading: tasksQuery.isLoading || submissionsQuery.isLoading,
    isFetchingNextPage: tasksQuery.isFetchingNextPage,
    hasNextPage: tasksQuery.hasNextPage ?? false,
    fetchNextPage: () => {
      void tasksQuery.fetchNextPage();
    },
    refetch: () => {
      void tasksQuery.refetch();
      void submissionsQuery.refetch();
    },
  };
}
