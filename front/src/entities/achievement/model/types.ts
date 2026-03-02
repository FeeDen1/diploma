import type { AchievementType } from '../../../shared/config/api';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  points: number;
  imageUrl: string | null;
}

export type AchievementStatus = 'available' | 'pending' | 'completed' | 'rejected';

export interface UserAchievement extends Achievement {
  status: AchievementStatus;
  submissionId?: string;
}

