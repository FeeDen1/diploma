import { useMemo } from 'react';
import {
  flattenInfiniteTasks,
  useInfiniteTasks,
  type Task,
} from '@entities/task';
import {
  useMySubmissions,
  type MySubmission,
  type SubmissionStatus,
} from '@entities/submission';
import type { TaskCategory, TasksSort } from '@shared/api/tasks';

export type AchievementStatus = 'available' | 'pending' | 'approved' | 'rejected';

export interface AchievementView extends Task {
  status: AchievementStatus;
  submission?: MySubmission;
}

const SUBMISSION_TO_STATUS: Record<SubmissionStatus, AchievementStatus> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
};

export interface UseAchievementsViewArgs {
  category?: TaskCategory;
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
 * Возвращает плоский массив, удобный для FlatList, плюс контролы пагинации.
 */
export function useAchievementsView(
  args: UseAchievementsViewArgs = {},
): AchievementsViewResult {
  const tasksQuery = useInfiniteTasks({
    category: args.category,
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
    return tasks.map<AchievementView>((task) => {
      const submission = submissionByTaskId.get(task.id);
      const status: AchievementStatus = submission
        ? SUBMISSION_TO_STATUS[submission.status]
        : 'available';
      return { ...task, status, submission };
    });
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
