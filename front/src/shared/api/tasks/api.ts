import { apiClient } from '../client';
import type {
  CreateTaskDto,
  ListTasksQuery,
  PaginatedTasksDto,
  ReadTaskDto,
  UpdateTaskDto,
} from './types';

/**
 * Превращает ListTasksQuery в плоский набор query-параметров. Списки
 * сериализуются в csv (бэк принимает csv-строку), пустые/false-фильтры
 * опускаются, чтобы не засорять URL и не ломать кеш-ключ.
 */
function buildListParams(
  query: ListTasksQuery,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (query.categories && query.categories.length > 0) {
    params.categories = query.categories.join(',');
  }
  if (query.states && query.states.length > 0) {
    params.states = query.states.join(',');
  }
  if (query.temporalOnly) params.temporalOnly = 'true';
  if (query.includeArchived) params.includeArchived = 'true';
  if (query.sort) params.sort = query.sort;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.offset !== undefined) params.offset = query.offset;
  return params;
}

export const tasksApi = {
  async list(query: ListTasksQuery = {}): Promise<PaginatedTasksDto> {
    const { data } = await apiClient.get<PaginatedTasksDto>('/tasks', {
      params: buildListParams(query),
    });
    return data;
  },

  async getById(id: string): Promise<ReadTaskDto> {
    const { data } = await apiClient.get<ReadTaskDto>(`/tasks/${id}`);
    return data;
  },

  async create(dto: CreateTaskDto): Promise<ReadTaskDto> {
    const { data } = await apiClient.post<ReadTaskDto>('/tasks', dto);
    return data;
  },

  async update(id: string, dto: UpdateTaskDto): Promise<ReadTaskDto> {
    const { data } = await apiClient.patch<ReadTaskDto>(`/tasks/${id}`, dto);
    return data;
  },

  async archive(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async restore(id: string): Promise<ReadTaskDto> {
    const { data } = await apiClient.patch<ReadTaskDto>(`/tasks/${id}/restore`);
    return data;
  },
};
