import type { UserRole, UserStatus } from '../../shared/api/users';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  ratingTotal: number;
  spentPoints: number;
  /** Доступные баллы = ratingTotal - spentPoints. Считается на фронте. */
  availablePoints: number;
  avatarUrl: string | null;
  createdAt: Date;
}

export type { UserRole, UserStatus };
