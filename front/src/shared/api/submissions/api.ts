import { apiClient } from '../client';
import type {
  ChangeStatusDto,
  CreateSubmissionDto,
  MySubmissionDto,
  ReadSubmissionDto,
} from './types';

export const submissionsApi = {
  async create(dto: CreateSubmissionDto): Promise<ReadSubmissionDto> {
    const { data } = await apiClient.post<ReadSubmissionDto>('/submissions', dto);
    return data;
  },

  async getMy(): Promise<MySubmissionDto[]> {
    const { data } = await apiClient.get<MySubmissionDto[]>('/submissions/my');
    return data;
  },

  async getByTask(taskId: string): Promise<ReadSubmissionDto[]> {
    const { data } = await apiClient.get<ReadSubmissionDto[]>('/submissions', {
      params: { taskId },
    });
    return data;
  },

  async getByStudent(studentId: string): Promise<ReadSubmissionDto[]> {
    const { data } = await apiClient.get<ReadSubmissionDto[]>('/submissions', {
      params: { studentId },
    });
    return data;
  },

  async update(
    id: string,
    dto: { submissionFileId: string },
  ): Promise<ReadSubmissionDto> {
    const { data } = await apiClient.patch<ReadSubmissionDto>(
      `/submissions/${id}`,
      dto,
    );
    return data;
  },

  async getById(id: string): Promise<ReadSubmissionDto> {
    const { data } = await apiClient.get<ReadSubmissionDto>(`/submissions/${id}`);
    return data;
  },

  async changeStatus(id: string, dto: ChangeStatusDto): Promise<ReadSubmissionDto> {
    const { data } = await apiClient.patch<ReadSubmissionDto>(
      `/submissions/${id}/status`,
      dto,
    );
    return data;
  },

  async deleteMine(id: string): Promise<void> {
    await apiClient.delete(`/submissions/${id}`);
  },
};
