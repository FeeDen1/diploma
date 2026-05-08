import { apiClient } from '../client';
import type { ReadGroupDto } from '../groups/types';
import type {
  ChangeRoleDto,
  MyGroupsDto,
  ReadUserDto,
  SetAvatarDto,
} from './types';

export const usersApi = {
  async getMe(): Promise<ReadUserDto> {
    const { data } = await apiClient.get<ReadUserDto>('/users/me');
    return data;
  },

  async getAll(): Promise<ReadUserDto[]> {
    const { data } = await apiClient.get<ReadUserDto[]>('/users');
    return data;
  },

  async getById(id: string): Promise<ReadUserDto> {
    const { data } = await apiClient.get<ReadUserDto>(`/users/${id}`);
    return data;
  },

  async setAvatar(dto: SetAvatarDto): Promise<ReadUserDto> {
    const { data } = await apiClient.patch<ReadUserDto>('/users/me/avatar', dto);
    return data;
  },

  async getMyGroups(): Promise<MyGroupsDto> {
    const { data } = await apiClient.get<MyGroupsDto>('/users/me/groups');
    return data;
  },

  async joinGroup(groupId: string): Promise<void> {
    await apiClient.post(`/users/me/groups/${groupId}`);
  },

  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.delete(`/users/me/groups/${groupId}`);
  },

  async changeRole(id: string, dto: ChangeRoleDto): Promise<ReadUserDto> {
    const { data } = await apiClient.patch<ReadUserDto>(`/users/${id}/role`, dto);
    return data;
  },

  async getCuratedGroups(id: string): Promise<ReadGroupDto[]> {
    const { data } = await apiClient.get<ReadGroupDto[]>(
      `/users/${id}/curated-groups`,
    );
    return data;
  },
};
