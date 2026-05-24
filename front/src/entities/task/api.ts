import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
  type InfiniteData,
} from '@tanstack/react-query';
import { queryKeys } from '@shared/api';
import {
  tasksApi,
  type CreateTaskDto,
  type ListTasksQuery,
  type PaginatedTasksDto,
  type UpdateTaskDto,
} from '@shared/api/tasks';
import { toTaskDomain } from './mappers';
import type { Task } from './types';

const PAGE_SIZE = 20;

interface InfiniteTasksFilters {
  categories?: ListTasksQuery['categories'];
  states?: ListTasksQuery['states'];
  temporalOnly?: ListTasksQuery['temporalOnly'];
  sort?: ListTasksQuery['sort'];
  includeArchived?: ListTasksQuery['includeArchived'];
}

/**
 * Бесконечная подгрузка заданий для виртуализованного FlatList.
 * Бэк отдаёт страницу offset/limit + total — отсюда вычисляем nextOffset.
 */
export function useInfiniteTasks(
  filters: InfiniteTasksFilters = {},
): UseInfiniteQueryResult<InfiniteData<PaginatedTasksDto>, unknown> {
  return useInfiniteQuery({
    queryKey: ['tasks', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) =>
      tasksApi.list({
        ...filters,
        limit: PAGE_SIZE,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
  });
}

/**
 * Удобный селектор-helper: разворачивает страницы InfiniteData в плоский массив доменных Task.
 */
export function flattenInfiniteTasks(
  data: InfiniteData<PaginatedTasksDto> | undefined,
): Task[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items.map(toTaskDomain));
}

export function useTasks(): UseQueryResult<Task[]> {
  return useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: () => tasksApi.list({ limit: 100 }).then((page) => page.items),
    select: (dtos) => dtos.map(toTaskDomain),
  });
}

/** Только число всех доступных пользователю задач (для прогресса в профиле). */
export function useTasksCount(): UseQueryResult<number> {
  return useQuery({
    queryKey: ['tasks', 'count'],
    queryFn: () => tasksApi.list({ limit: 1 }).then((page) => page.total),
  });
}

export function useTask(id: string | undefined): UseQueryResult<Task> {
  return useQuery({
    queryKey: id ? queryKeys.tasks.byId(id) : ['tasks', 'noop'],
    queryFn: () => tasksApi.getById(id as string),
    select: toTaskDomain,
    enabled: !!id,
  });
}

export function useCreateTask(): UseMutationResult<Task, unknown, CreateTaskDto> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto) => tasksApi.create(dto).then(toTaskDomain),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: ['tasks', 'infinite'] });
    },
  });
}

export function useUpdateTask(): UseMutationResult<
  Task,
  unknown,
  { id: string; dto: UpdateTaskDto }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }) => tasksApi.update(id, dto).then(toTaskDomain),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: ['tasks', 'infinite'] });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.byId(task.id) });
    },
  });
}

export function useArchiveTask(): UseMutationResult<void, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => tasksApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: ['tasks', 'infinite'] });
      qc.invalidateQueries({ queryKey: ['tasks', 'count'] });
    },
  });
}

export function useUnarchiveTask(): UseMutationResult<Task, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => tasksApi.restore(id).then(toTaskDomain),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: ['tasks', 'infinite'] });
      qc.invalidateQueries({ queryKey: ['tasks', 'count'] });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.byId(task.id) });
    },
  });
}
