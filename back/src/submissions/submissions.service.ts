import { Injectable, Logger } from '@nestjs/common';
import {
  SubmissionsRepository,
  SubmissionWithRelations,
} from './submissions.repository';
import { TasksService } from '../tasks/tasks.service';
import { FilesService } from '../files/files.service';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { EntityAlreadyExistsException } from '../common/exceptions/conflict.exception';
import { DomainValidationException } from '../common/exceptions/validation.exception';
import { ForbiddenException } from '../common/exceptions/forbidden.exception';
import {
  FileType,
  SubmissionStatus,
  UserRole,
} from '../../generated/prisma/client';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { S3Service } from '../s3/s3.service';
import { TaskWithFile } from '../tasks/tasks.repository';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private readonly submissionsRepository: SubmissionsRepository,
    private readonly tasksService: TasksService,
    private readonly filesService: FilesService,
    private readonly s3Service: S3Service,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createSubmission(
    taskId: string,
    user: TokenPayload,
    submissionFileId: string,
  ): Promise<SubmissionWithRelations> {
    if (user.role === UserRole.adapter) {
      const isMember = await this.submissionsRepository.isGroupMember(user.id);
      if (!isMember) {
        throw new ForbiddenException(
          'Куратор может сдавать задания только если является участником группы',
        );
      }
    }

    const task = await this.tasksService.getTaskByIdRaw(taskId);
    this.assertTaskAcceptsSubmissions(task);

    const existing = await this.submissionsRepository.findExisting(
      taskId,
      user.id,
    );
    if (existing) {
      throw new EntityAlreadyExistsException(
        'TaskSubmission',
        'taskId+studentId',
        taskId,
      );
    }

    await this.filesService.assertOwnedAndType(
      submissionFileId,
      user.id,
      FileType.submission,
    );

    const isFileTaken =
      await this.submissionsRepository.isSubmissionFileTaken(submissionFileId);
    if (isFileTaken) {
      throw new DomainValidationException('Файл уже привязан к другой сдаче');
    }

    const created = await this.submissionsRepository.create(
      taskId,
      user.id,
      submissionFileId,
    );

    // fire-and-forget: пуши не должны блокировать или валить основной flow.
    void this.notifyAdaptersAboutNewSubmission(created).catch((err) =>
      this.logger.warn(`Push (новая сдача) не отправился: ${String(err)}`),
    );

    return created;
  }

  private async notifyAdaptersAboutNewSubmission(
    submission: SubmissionWithRelations,
  ): Promise<void> {
    const adapterIds = await this.submissionsRepository.getAdapterIdsForStudent(
      submission.studentId,
    );
    if (adapterIds.length === 0) return;

    const studentName =
      `${submission.student.firstName} ${submission.student.lastName}`.trim();

    await this.notificationsService.notifyUsers(adapterIds, {
      title: 'Новая сдача на проверку',
      body: `${studentName} сдал «${submission.task.title}»`,
      data: {
        type: 'submission-new',
        submissionId: submission.id,
        taskId: submission.task.id,
      },
    });
  }

  async getMySubmissions(
    studentId: string,
  ): Promise<SubmissionWithRelations[]> {
    return this.submissionsRepository.findByStudentId(studentId);
  }

  async getSubmissionsByTaskId(
    taskId: string,
    user: TokenPayload,
  ): Promise<SubmissionWithRelations[]> {
    await this.tasksService.getTaskByIdRaw(taskId);

    if (user.role === UserRole.admin) {
      return this.submissionsRepository.findByTaskId(taskId);
    }

    if (user.role === UserRole.adapter) {
      const studentIds =
        await this.submissionsRepository.getStudentIdsForAdapter(user.id);
      return this.submissionsRepository.findByTaskIdAndStudentIds(
        taskId,
        studentIds,
      );
    }

    throw new ForbiddenException('Нет доступа');
  }

  async getSubmissionsByStudentId(
    studentId: string,
    user: TokenPayload,
  ): Promise<SubmissionWithRelations[]> {
    if (user.role === UserRole.admin) {
      return this.submissionsRepository.findByStudentId(studentId);
    }

    if (user.role === UserRole.adapter) {
      const studentIds =
        await this.submissionsRepository.getStudentIdsForAdapter(user.id);
      if (!studentIds.includes(studentId)) {
        throw new ForbiddenException('Студент не в ваших группах');
      }
      return this.submissionsRepository.findByStudentId(studentId);
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

    const updated = await this.submissionsRepository.changeStatusWithRating(
      id,
      submission.status,
      newStatus,
      submission.studentId,
      submission.task.points,
    );

    // Нотификация студенту только при переходе в финальные статусы.
    // Возврат в pending (откат approve) — внутреннее действие, не дёргаем.
    if (
      newStatus === SubmissionStatus.approved ||
      newStatus === SubmissionStatus.rejected
    ) {
      void this.notifyStudentAboutSubmissionStatus(updated, newStatus).catch(
        (err) =>
          this.logger.warn(`Push (статус сдачи) не отправился: ${String(err)}`),
      );
    }

    return updated;
  }

  private async notifyStudentAboutSubmissionStatus(
    submission: SubmissionWithRelations,
    status: SubmissionStatus,
  ): Promise<void> {
    const taskTitle = submission.task.title;

    const payload =
      status === SubmissionStatus.approved
        ? {
            title: 'Сдача засчитана',
            body: `«${taskTitle}» одобрена. +${submission.task.points} баллов`,
          }
        : {
            title: 'Сдача отклонена',
            body: `«${taskTitle}» — попробуй перезалить фото`,
          };

    await this.notificationsService.notifyUser(submission.studentId, {
      ...payload,
      data: {
        type: 'submission-status',
        submissionId: submission.id,
        taskId: submission.task.id,
        status,
      },
    });
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

  /**
   * Перезалить файл-доказательство в собственной сдаче.
   * Только автор. После замены — статус pending. Старый файл удаляется из S3.
   */
  async replaceMyFile(
    id: string,
    newFileId: string,
    user: TokenPayload,
  ): Promise<SubmissionWithRelations> {
    const submission = await this.submissionsRepository.findById(id);
    if (!submission) {
      throw new EntityNotFoundException('TaskSubmission', id);
    }
    if (submission.studentId !== user.id) {
      throw new ForbiddenException('Можно изменить только свою сдачу');
    }

    this.assertTaskAcceptsSubmissions(submission.task);

    await this.filesService.assertOwnedAndType(
      newFileId,
      user.id,
      FileType.submission,
    );
    if (newFileId !== submission.submissionFileId) {
      const taken =
        await this.submissionsRepository.isSubmissionFileTaken(newFileId);
      if (taken) {
        throw new DomainValidationException('Файл уже привязан к другой сдаче');
      }
    }

    const oldFileId = submission.submissionFileId;
    const updated = await this.submissionsRepository.replaceFileAndResetStatus(
      id,
      newFileId,
      submission.studentId,
      submission.status,
      submission.task.points,
    );

    if (oldFileId !== newFileId) {
      try {
        await this.filesService.deleteFile(oldFileId, user.id, false);
      } catch {
        // не валим запрос, если удаление старого файла не вышло
      }
    }

    return updated;
  }

  /**
   * Удаление собственной сдачи — доступно только автору и только в статусе pending.
   * Файл сдачи в S3 удаляется через FilesService, далее БД-каскад снесёт саму сдачу.
   */
  async deleteMySubmission(id: string, user: TokenPayload): Promise<void> {
    const submission = await this.submissionsRepository.findById(id);
    if (!submission) {
      throw new EntityNotFoundException('TaskSubmission', id);
    }
    if (submission.studentId !== user.id) {
      throw new ForbiddenException('Можно удалить только свою сдачу');
    }
    if (submission.status !== SubmissionStatus.pending) {
      throw new DomainValidationException(
        'Удалить можно только сдачу в статусе "на проверке"',
      );
    }
    await this.filesService.deleteFile(
      submission.submissionFileId,
      user.id,
      false,
    );
  }

  /**
   * Проверяет, что задание открыто для приёма сдач:
   * не архивировано и не просрочено.
   */
  private assertTaskAcceptsSubmissions(task: TaskWithFile): void {
    if (task.archivedAt) {
      throw new DomainValidationException('Задание архивировано');
    }
    if (task.expiresAt && task.expiresAt < new Date()) {
      throw new DomainValidationException('Срок сдачи задания истёк');
    }
  }

  private async assertCanViewSubmission(
    submission: SubmissionWithRelations,
    user: TokenPayload,
  ): Promise<void> {
    if (user.role === UserRole.admin) return;

    if (user.role === UserRole.adapter) {
      const studentIds =
        await this.submissionsRepository.getStudentIdsForAdapter(user.id);
      if (studentIds.includes(submission.studentId)) return;
    }

    throw new ForbiddenException('Нет доступа к данной сдаче');
  }

  private async assertCanManageSubmission(
    submission: SubmissionWithRelations,
    user: TokenPayload,
  ): Promise<void> {
    if (user.role === UserRole.admin) return;

    if (user.role === UserRole.adapter) {
      const studentIds =
        await this.submissionsRepository.getStudentIdsForAdapter(user.id);
      if (studentIds.includes(submission.studentId)) return;
      throw new ForbiddenException('Студент не в вашей группе');
    }

    throw new ForbiddenException('Нет доступа');
  }
}
