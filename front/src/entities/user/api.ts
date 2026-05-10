import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { queryKeys } from '@shared/api';
import { usersApi, type UserRole } from '@shared/api/users';
import { toGroupDomain } from '../group/mappers';
import type { Group } from '../group/types';
import { toUserDomain } from './mappers';
import type { User } from './types';

export function useMe(enabled = true): UseQueryResult<User> {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: usersApi.getMe,
    select: toUserDomain,
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useUsers(): UseQueryResult<User[]> {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: usersApi.getAll,
    select: (dtos) => dtos.map(toUserDomain),
  });
}

export function useUser(id: string | undefined): UseQueryResult<User> {
  return useQuery({
    queryKey: id ? queryKeys.users.byId(id) : ['users', 'noop'],
    queryFn: () => usersApi.getById(id as string),
    select: toUserDomain,
    enabled: !!id,
  });
}

export function useChangeUserRole(): UseMutationResult<
  User,
  unknown,
  { id: string; role: UserRole }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }) => usersApi.changeRole(id, { role }).then(toUserDomain),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.users.byId(user.id) });
    },
  });
}

export function useCuratedGroups(
  userId: string | undefined,
): UseQueryResult<Group[]> {
  return useQuery({
    queryKey: userId
      ? ['users', userId, 'curated-groups']
      : ['users', 'noop-curated'],
    queryFn: () => usersApi.getCuratedGroups(userId as string),
    select: (dtos) => dtos.map(toGroupDomain),
    enabled: !!userId,
  });
}

export function useSetMyAvatar(): UseMutationResult<User, unknown, { fileId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId }) => usersApi.setAvatar({ fileId }).then(toUserDomain),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}
