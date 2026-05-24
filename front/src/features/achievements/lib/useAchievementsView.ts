import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  flattenInfiniteTasks,
  useInfiniteTasks,
  type Task,
} from '@entities/task';
import { useMySubmissions, type MySubmission } from '@entities/submission';
import { queryKeys } from '@shared/api';
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
  /** Первичная загрузка — данных ещё нет. Для полноэкранного спиннера. */
  isLoading: boolean;
  /** Идёт инициированный пользователем pull-to-refresh. */
  isRefreshing: boolean;
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
 *
 * Свежесть данных:
 *  - при возврате на экран (useFocusEffect) лента инвалидируется в фоне —
 *    новое задание подхватывается без действий пользователя;
 *  - pull-to-refresh (refetch) принудительно идёт в сеть, минуя кэш.
 */
export function useAchievementsView(
  args: UseAchievementsViewArgs,
): AchievementsViewResult {
  const queryClient = useQueryClient();
  const tasksQuery = useInfiniteTasks({
    categories: args.filters.categories,
    states: args.filters.states,
    temporalOnly: args.filters.temporalOnly,
    sort: args.sort,
  });
  const submissionsQuery = useMySubmissions();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Возврат на экран — повод проверить, не появилось ли новых заданий.
  // Первый фокус пропускаем: данные и так грузятся при монтировании.
  const isInitialFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isInitialFocus.current) {
        isInitialFocus.current = false;
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.infinite,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.submissions.my,
      });
    }, [queryClient]),
  );

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

  const refetch = (): void => {
    setIsRefreshing(true);
    void Promise.all([
      tasksQuery.refetch(),
      submissionsQuery.refetch(),
    ]).finally(() => setIsRefreshing(false));
  };

  return {
    data,
    total,
    isLoading: tasksQuery.isLoading || submissionsQuery.isLoading,
    isRefreshing,
    isFetchingNextPage: tasksQuery.isFetchingNextPage,
    hasNextPage: tasksQuery.hasNextPage ?? false,
    fetchNextPage: () => {
      void tasksQuery.fetchNextPage();
    },
    refetch,
  };
}
