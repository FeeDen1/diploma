import type { TaskCategory, TaskType } from '../tasks/types';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

/**
 * Компактный DTO для GET /submissions/my — без блока student
 * (это всегда сам пользователь) и без тяжёлых полей задачи.
 */
export interface MySubmissionDto {
  id: string;
  status: SubmissionStatus;
  submissionFileUrl: string | null;
  task: {
    id: string;
    title: string;
    category: TaskCategory;
    points: number;
    taskFileUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Полный DTO для GET /submissions/:id и GET /submissions?taskId
 * (нужен куратору / админу — здесь блок student обязателен).
 */
export interface ReadSubmissionDto {
  id: string;
  status: SubmissionStatus;
  submissionFileUrl: string | null;
  task: {
    id: string;
    title: string;
    description: string;
    type: TaskType;
    category: TaskCategory;
    points: number;
    taskFileUrl: string | null;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionDto {
  taskId: string;
  submissionFileId: string;
}

export interface ChangeStatusDto {
  status: SubmissionStatus;
}
