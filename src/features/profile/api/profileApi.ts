import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockGetCurrentUser,
  mockUpdateAvatar,
  mockGetUserSubmissions,
  mockGetAchievements,
} from '../../../shared/api/mocks';
import { useAuthStore } from '../../../entities/user';

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id ?? '');

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const [user, submissions, achievements] = await Promise.all([
        mockGetCurrentUser(),
        mockGetUserSubmissions(userId),
        mockGetAchievements(),
      ]);

      const completedCount = submissions.filter(
        (s) => s.status === 'approved'
      ).length;

      return {
        user,
        completedAchievements: completedCount,
        totalAchievements: achievements.length,
      };
    },
    enabled: !!userId,
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');

  return useMutation({
    mutationFn: (avatarUri: string) => mockUpdateAvatar(userId, avatarUri),
    onSuccess: (user) => {
      useAuthStore.getState().updateUser({ avatar: user.avatar });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

