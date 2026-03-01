import { apiClient } from '../client';
import type {
  CreateTaskDto,
  ListTasksQuery,
  PaginatedTasksDto,
  ReadTaskDto,
  UpdateTaskDto,
} from './types';

export const tasksApi = {
  async list(query: ListTasksQuery = {}): Promise<PaginatedTasksDto> {
    const { data } = await apiClient.get<PaginatedTasksDto>('/tasks', {
      params: query,
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
