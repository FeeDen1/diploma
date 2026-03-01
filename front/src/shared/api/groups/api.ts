import { apiClient } from '../client';
import type {
  AddAdapterDto,
  AddMemberDto,
  CreateGroupDto,
  GroupsListFilters,
  GroupStudentProgressDto,
  ReadGroupDetailDto,
  ReadGroupDto,
  UpdateGroupDto,
} from './types';

export const groupsApi = {
  async getAll(filters: GroupsListFilters = {}): Promise<ReadGroupDto[]> {
    const { data } = await apiClient.get<ReadGroupDto[]>('/groups', {
      params: filters.direction ? { direction: filters.direction } : undefined,
    });
    return data;
  },

  async getById(id: string): Promise<ReadGroupDetailDto> {
    const { data } = await apiClient.get<ReadGroupDetailDto>(`/groups/${id}`);
    return data;
  },

  async create(dto: CreateGroupDto): Promise<ReadGroupDto> {
    const { data } = await apiClient.post<ReadGroupDto>('/groups', dto);
    return data;
  },

  async update(id: string, dto: UpdateGroupDto): Promise<ReadGroupDto> {
    const { data } = await apiClient.patch<ReadGroupDto>(`/groups/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/groups/${id}`);
  },

  async addMember(groupId: string, dto: AddMemberDto): Promise<void> {
    await apiClient.post(`/groups/${groupId}/members`, dto);
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  },

  async addAdapter(groupId: string, dto: AddAdapterDto): Promise<void> {
    await apiClient.post(`/groups/${groupId}/adapters`, dto);
  },

  async removeAdapter(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/adapters/${userId}`);
  },

  async getStudentsProgress(groupId: string): Promise<GroupStudentProgressDto[]> {
    const { data } = await apiClient.get<GroupStudentProgressDto[]>(
      `/groups/${groupId}/students-progress`,
    );
    return data;
  },
};
