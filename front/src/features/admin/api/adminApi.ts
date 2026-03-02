import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockCreateAchievement,
  mockSearchUsers,
  mockUpdateUserRole,
  mockGetUsers,
} from '../../../shared/api/mocks';
import type { Achievement } from '../../../entities/achievement';
import type { User } from '../../../entities/user';

export function useCreateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Achievement, 'id'>) => mockCreateAchievement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: mockGetUsers,
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => mockSearchUsers(query),
    enabled: query.length > 0,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: User['role'];
    }) => mockUpdateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

