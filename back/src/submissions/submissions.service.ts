import { Injectable } from '@nestjs/common';
import { SubmissionsRepository, SubmissionWithRelations } from './submissions.repository';
import { TasksService } from '../tasks/tasks.service';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { EntityAlreadyExistsException } from '../common/exceptions/conflict.exception';
import { DomainValidationException } from '../common/exceptions/validation.exception';
import { ForbiddenException } from '../common/exceptions/forbidden.exception';
import { SubmissionStatus, UserRole } from '../../generated/prisma/client';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly submissionsRepository: SubmissionsRepository,
    private readonly tasksService: TasksService,
    private readonly s3Service: S3Service,
  ) {}

  async createSubmission(
    taskId: string,
    user: TokenPayload,
    submissionFileId?: string,
  ): Promise<SubmissionWithRelations> {
    if (user.role === UserRole.adapter) {
      const isMember = await this.submissionsRepository.isGroupMember(user.id);
      if (!isMember) {
        throw new ForbiddenException('Куратор может сдавать задания только если является участником группы');
      }
    }

    await this.tasksService.getTaskById(taskId);

    const existing = await this.submissionsRepository.findExisting(taskId, user.id);
    if (existing) {
      throw new EntityAlreadyExistsException('TaskSubmission', 'taskId+studentId', taskId);
    }

    return this.submissionsRepository.create(taskId, user.id, submissionFileId);
  }

  async getMySubmissions(studentId: string): Promise<SubmissionWithRelations[]> {
    return this.submissionsRepository.findByStudentId(studentId);
  }

  async getSubmissionsByTaskId(
    taskId: string,
    user: TokenPayload,
  ): Promise<SubmissionWithRelations[]> {
    await this.tasksService.getTaskById(taskId);

    if (user.role === UserRole.admin) {
      return this.submissionsRepository.findByTaskId(taskId);
    }

    if (user.role === UserRole.adapter) {
      const studentIds = await this.submissionsRepository.getStudentIdsForAdapter(user.id);
      return this.submissionsRepository.findByTaskIdAndStudentIds(taskId, studentIds);
    }

    throw new ForbiddenException('Нет доступа');
  }

  async getSubmissionById(
    id: string,
    user: TokenPayload,
  ): Promise<SubmissionWithRelations> {
    const submission = await this.submissionsRepository.findById(id);
    if (!submission) {
      throw new EntityNotFoundException('TaskSubmission', id);
    }

    await this.assertCanViewSubmission(submission, user);
    return submission;
  }

  async changeStatus(
    id: string,
    newStatus: SubmissionStatus,
    user: TokenPayload,
  ): Promise<SubmissionWithRelations> {
    const submission = await this.submissionsRepository.findById(id);
    if (!submission) {
      throw new EntityNotFoundException('TaskSubmission', id);
    }

    if (submission.status === newStatus) {
      throw new DomainValidationException(`Статус уже ${newStatus}`);
    }

    await this.assertCanManageSubmission(submission, user);

    return this.submissionsRepository.changeStatusWithRating(
      id,
      submission.status,
      newStatus,
      submission.studentId,
      submission.task.points,
    );
  }

  private async assertCanViewSubmission(
    submission: SubmissionWithRelations,
    user: TokenPayload,
  ): Promise<void> {
    if (user.role === UserRole.admin) return;

    if (user.role === UserRole.adapter) {
      const studentIds = await this.submissionsRepository.getStudentIdsForAdapter(user.id);
      if (studentIds.includes(submission.studentId)) return;
    }

    throw new ForbiddenException('Нет доступа к данной сдаче');
  }

  getFileUrls(submission: SubmissionWithRelations) {
    return {
      submissionFileUrl: submission.submissionFile
        ? this.s3Service.getPublicUrl(submission.submissionFile.objectKey)
        : null,
      taskFileUrl: submission.task.taskFile
        ? this.s3Service.getPublicUrl(submission.task.taskFile.objectKey)
        : null,
      avatarUrl: submission.student.avatarFile
        ? this.s3Service.getPublicUrl(submission.student.avatarFile.objectKey)
        : null,
    };
  }

  private async assertCanManageSubmission(
    submission: SubmissionWithRelations,
    user: TokenPayload,
  ): Promise<void> {
    if (user.role === UserRole.admin) return;

    if (user.role === UserRole.adapter) {
      const studentIds = await this.submissionsRepository.getStudentIdsForAdapter(user.id);
      if (studentIds.includes(submission.studentId)) return;
      throw new ForbiddenException('Студент не в вашей группе');
    }

    throw new ForbiddenException('Нет доступа');
  }
}
