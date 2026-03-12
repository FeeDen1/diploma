import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { queryKeys } from '../../shared/api';
import {
  groupsApi,
  type CreateGroupDto,
  type GroupsListFilters,
  type UpdateGroupDto,
} from '@shared/api/groups';
import { usersApi } from '../../shared/api/users';
import { toGroupDetailDomain, toGroupDomain } from './mappers';
import type { Group, GroupDetail } from './types';

export interface MyGroups {
  memberOf: Group[];
  curatorOf: Group[];
}

export function useGroups(
  filters: GroupsListFilters = {},
): UseQueryResult<Group[]> {
  return useQuery({
    queryKey: queryKeys.groups.list(filters),
    queryFn: () => groupsApi.getAll(filters),
    select: (dtos) => dtos.map(toGroupDomain),
  });
}

export function useGroup(id: string | undefined): UseQueryResult<GroupDetail> {
  return useQuery({
    queryKey: id ? queryKeys.groups.byId(id) : ['groups', 'noop'],
    queryFn: () => groupsApi.getById(id as string),
    select: toGroupDetailDomain,
    enabled: !!id,
  });
}

export function useCreateGroup(): UseMutationResult<Group, unknown, CreateGroupDto> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto) => groupsApi.create(dto).then(toGroupDomain),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.groups.all }),
  });
}

export function useUpdateGroup(): UseMutationResult<
  Group,
  unknown,
  { id: string; dto: UpdateGroupDto }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }) => groupsApi.update(id, dto).then(toGroupDomain),
    onSuccess: (group) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      qc.invalidateQueries({ queryKey: queryKeys.groups.byId(group.id) });
    },
  });
}

export function useDeleteGroup(): UseMutationResult<void, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => groupsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.groups.all }),
  });
}

export function useAddGroupMember(): UseMutationResult<
  void,
  unknown,
  { groupId: string; userId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }) =>
      groupsApi.addMember(groupId, { userId }),
    onSuccess: (_data, { groupId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.byId(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

export function useRemoveGroupMember(): UseMutationResult<
  void,
  unknown,
  { groupId: string; userId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }) => groupsApi.removeMember(groupId, userId),
    onSuccess: (_data, { groupId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.byId(groupId) });
    },
  });
}

export function useAddGroupAdapter(): UseMutationResult<
  void,
  unknown,
  { groupId: string; userId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }) =>
      groupsApi.addAdapter(groupId, { userId }),
    onSuccess: (_data, { groupId, userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.byId(groupId) });
      qc.invalidateQueries({ queryKey: ['users', userId, 'curated-groups'] });
      qc.invalidateQueries({
        queryKey: ['groups', groupId, 'students-progress'],
      });
      // Если admin поменял группы у самого себя — обновим и /me/groups,
      // чтобы вкладка Куратор подтянула актуальный список.
      qc.invalidateQueries({ queryKey: ['users', 'me', 'groups'] });
    },
  });
}

export function useRemoveGroupAdapter(): UseMutationResult<
  void,
  unknown,
  { groupId: string; userId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }) => groupsApi.removeAdapter(groupId, userId),
    onSuccess: (_data, { groupId, userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.byId(groupId) });
      qc.invalidateQueries({ queryKey: ['users', userId, 'curated-groups'] });
      qc.invalidateQueries({
        queryKey: ['groups', groupId, 'students-progress'],
      });
      qc.invalidateQueries({ queryKey: ['users', 'me', 'groups'] });
    },
  });
}

export interface StudentProgressItem {
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    email: string;
  };
  submissions: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}

export function useStudentsProgress(
  groupId: string | undefined,
): UseQueryResult<StudentProgressItem[]> {
  return useQuery({
    queryKey: groupId
      ? (['groups', groupId, 'students-progress'] as const)
      : (['groups', 'noop-progress'] as const),
    queryFn: () => groupsApi.getStudentsProgress(groupId as string),
    enabled: !!groupId,
    select: (dtos) =>
      dtos.map((dto) => ({
        user: {
          id: dto.user.id,
          fullName: `${dto.user.firstName} ${dto.user.lastName}`.trim(),
          avatarUrl: dto.user.avatarUrl,
          email: dto.user.email,
        },
        submissions: dto.submissions,
      })),
  });
}

export function useMyGroups(): UseQueryResult<MyGroups> {
  return useQuery({
    queryKey: ['users', 'me', 'groups'] as const,
    queryFn: usersApi.getMyGroups,
    select: (dto) => ({
      memberOf: dto.memberOf.map(toGroupDomain),
      curatorOf: dto.curatorOf.map(toGroupDomain),
    }),
  });
}

export function useJoinGroup(): UseMutationResult<void, unknown, { groupId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId }) => usersApi.joinGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me', 'groups'] });
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

// Direction экспортируется из types.ts — не дублируем через barrel
