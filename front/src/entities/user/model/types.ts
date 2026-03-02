import type { Direction, UserRole } from '../../../shared/config/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  direction: Direction;
  group: string;
  role: UserRole;
  totalPoints: number;
}

export interface UserProfile extends User {
  completedAchievements: number;
  totalAchievements: number;
}

