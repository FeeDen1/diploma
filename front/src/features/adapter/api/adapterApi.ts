import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockGetGroupSubmissions,
  mockGetAllSubmissions,
  mockReviewSubmission,
  mockGetAchievements,
  mockGetUsers,
} from '../../../shared/api/mocks';
import type { SubmissionWithDetails } from '../../../entities/submission';

export function useGroupSubmissions(group?: string) {
  return useQuery({
    queryKey: ['submissions', 'group', group],
    queryFn: async (): Promise<SubmissionWithDetails[]> => {
      const [submissions, achievements, users] = await Promise.all([
        group ? mockGetGroupSubmissions(group) : mockGetAllSubmissions(),
        mockGetAchievements(),
        mockGetUsers(),
      ]);

      return submissions.map((sub) => {
        const achievement = achievements.find((a) => a.id === sub.achievementId);
        const user = users.find((u) => u.id === sub.userId);
        return {
          ...sub,
          achievementTitle: achievement?.title ?? 'Неизвестно',
          userName: user ? `${user.firstName} ${user.lastName}` : 'Неизвестно',
          achievementPoints: achievement?.points ?? 0,
        };
      });
    },
  });
}

export function useReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      status,
    }: {
      submissionId: string;
      status: 'approved' | 'rejected';
    }) => mockReviewSubmission(submissionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

