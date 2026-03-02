import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockGetAchievements,
  mockGetUserSubmissions,
  mockCreateSubmission,
} from '../../../shared/api/mocks';
import { useAuthStore } from '../../../entities/user';
import type { UserAchievement, AchievementStatus } from '../../../entities/achievement';

export function useAchievements() {
  const userId = useAuthStore((s) => s.user?.id ?? '');

  return useQuery({
    queryKey: ['achievements', userId],
    queryFn: async (): Promise<UserAchievement[]> => {
      const [achievements, submissions] = await Promise.all([
        mockGetAchievements(),
        mockGetUserSubmissions(userId),
      ]);

      return achievements.map((ach) => {
        const submission = submissions.find((s) => s.achievementId === ach.id);
        let status: AchievementStatus = 'available';
        if (submission) {
          status =
            submission.status === 'approved'
              ? 'completed'
              : submission.status === 'rejected'
                ? 'rejected'
                : 'pending';
        }
        return {
          ...ach,
          status,
          submissionId: submission?.id,
        };
      });
    },
  });
}

export function useSubmitAchievement() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');

  return useMutation({
    mutationFn: async ({
      achievementId,
      photoUri,
    }: {
      achievementId: string;
      photoUri: string;
    }) => {
      return mockCreateSubmission({ achievementId, userId, photoUri });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

