export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  achievementId: string;
  userId: string;
  photoUri: string;
  status: SubmissionStatus;
  createdAt: string;
}

export interface SubmissionWithDetails extends Submission {
  achievementTitle: string;
  userName: string;
  achievementPoints: number;
}

