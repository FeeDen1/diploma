import type {
  MySubmissionDto,
  ReadSubmissionDto,
} from '@shared/api/submissions';
import type { MySubmission, Submission } from './types';

export function toSubmissionDomain(dto: ReadSubmissionDto): Submission {
  return {
    id: dto.id,
    taskId: dto.task.id,
    studentId: dto.student.id,
    status: dto.status,
    submissionFileUrl: dto.submissionFileUrl,
    taskFileUrl: dto.task.taskFileUrl,
    studentAvatarUrl: dto.student.avatarUrl,
    task: {
      id: dto.task.id,
      title: dto.task.title,
      description: dto.task.description,
      category: dto.task.category,
      points: dto.task.points,
    },
    student: {
      id: dto.student.id,
      firstName: dto.student.firstName,
      lastName: dto.student.lastName,
      fullName: `${dto.student.firstName} ${dto.student.lastName}`.trim(),
      email: dto.student.email,
    },
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

export function toMySubmissionDomain(dto: MySubmissionDto): MySubmission {
  return {
    id: dto.id,
    taskId: dto.task.id,
    status: dto.status,
    submissionFileUrl: dto.submissionFileUrl,
    task: {
      id: dto.task.id,
      title: dto.task.title,
      category: dto.task.category,
      points: dto.task.points,
      coverUrl: dto.task.taskFileUrl,
    },
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}
