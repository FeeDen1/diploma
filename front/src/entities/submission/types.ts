import type { SubmissionStatus } from '@shared/api/submissions';
import type { TaskCategory } from '@shared/api/tasks';

/** Полная сдача — для куратора/админа */
export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  status: SubmissionStatus;
  submissionFileUrl: string | null;
  taskFileUrl: string | null;
  studentAvatarUrl: string | null;
  task: {
    id: string;
    title: string;
    description: string;
    category: TaskCategory;
    points: number;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/** Компактная сдача — для своих списков (без блока студента и тяжёлых полей) */
export interface MySubmission {
  id: string;
  taskId: string;
  status: SubmissionStatus;
  submissionFileUrl: string | null;
  task: {
    id: string;
    title: string;
    category: TaskCategory;
    points: number;
    coverUrl: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type { SubmissionStatus };
