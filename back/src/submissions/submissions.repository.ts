import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { SubmissionStatus, Prisma } from '../../generated/prisma/client';

const INCLUDE_RELATIONS = {
  task: { include: { taskFile: true } },
  student: { include: { avatarFile: true } },
  submissionFile: true,
} satisfies Prisma.TaskSubmissionInclude;

export type SubmissionWithRelations = Prisma.TaskSubmissionGetPayload<{
  include: typeof INCLUDE_RELATIONS;
}>;

@Injectable()
export class SubmissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    taskId: string,
    studentId: string,
    submissionFileId: string,
  ): Promise<SubmissionWithRelations> {
    return this.prisma.taskSubmission.create({
      data: { taskId, studentId, submissionFileId },
      include: INCLUDE_RELATIONS,
    }) as Promise<SubmissionWithRelations>;
  }

  async isSubmissionFileTaken(submissionFileId: string): Promise<boolean> {
    const existing = await this.prisma.taskSubmission.findUnique({
      where: { submissionFileId },
      select: { id: true },
    });
    return existing !== null;
  }

  /**
   * Атомарная замена файла-доказательства + сброс статуса в pending.
   * Используется при ресабмите (студент перезаливает фото после rejected).
   * Если статус был approved, дельту рейтинга вычитаем — сабмит уходит на повторную проверку.
   */
  async replaceFileAndResetStatus(
    id: string,
    newFileId: string,
    studentId: string,
    oldStatus: SubmissionStatus,
    taskPoints: number,
  ): Promise<SubmissionWithRelations> {
    const ratingDelta = this.calculateRatingDelta(
      oldStatus,
      SubmissionStatus.pending,
      taskPoints,
    );

    const [submission] = await this.prisma.$transaction([
      this.prisma.taskSubmission.update({
        where: { id },
        data: {
          submissionFileId: newFileId,
          status: SubmissionStatus.pending,
        },
        include: INCLUDE_RELATIONS,
      }),
      ...(ratingDelta !== 0
        ? [
            this.prisma.user.update({
              where: { id: studentId },
              data: { ratingTotal: { increment: ratingDelta } },
            }),
          ]
        : []),
    ]);

    return submission as SubmissionWithRelations;
  }

  async findById(id: string): Promise<SubmissionWithRelations | null> {
    return this.prisma.taskSubmission.findUnique({
      where: { id },
      include: INCLUDE_RELATIONS,
    }) as Promise<SubmissionWithRelations | null>;
  }

  async findByStudentId(studentId: string): Promise<SubmissionWithRelations[]> {
    return this.prisma.taskSubmission.findMany({
      where: { studentId },
      include: INCLUDE_RELATIONS,
      orderBy: { createdAt: 'desc' },
    }) as Promise<SubmissionWithRelations[]>;
  }

  async findByTaskId(taskId: string): Promise<SubmissionWithRelations[]> {
    return this.prisma.taskSubmission.findMany({
      where: { taskId },
      include: INCLUDE_RELATIONS,
      orderBy: { createdAt: 'desc' },
    }) as Promise<SubmissionWithRelations[]>;
  }

  async findByTaskIdAndStudentIds(
    taskId: string,
    studentIds: string[],
  ): Promise<SubmissionWithRelations[]> {
    return this.prisma.taskSubmission.findMany({
      where: { taskId, studentId: { in: studentIds } },
      include: INCLUDE_RELATIONS,
      orderBy: { createdAt: 'desc' },
    }) as Promise<SubmissionWithRelations[]>;
  }

  async findExisting(taskId: string, studentId: string) {
    return this.prisma.taskSubmission.findUnique({
      where: { taskId_studentId: { taskId, studentId } },
    });
  }

  async changeStatusWithRating(
    id: string,
    oldStatus: SubmissionStatus,
    newStatus: SubmissionStatus,
    studentId: string,
    taskPoints: number,
  ): Promise<SubmissionWithRelations> {
    const ratingDelta = this.calculateRatingDelta(
      oldStatus,
      newStatus,
      taskPoints,
    );

    const [submission] = await this.prisma.$transaction([
      this.prisma.taskSubmission.update({
        where: { id },
        data: { status: newStatus },
        include: INCLUDE_RELATIONS,
      }),
      ...(ratingDelta !== 0
        ? [
            this.prisma.user.update({
              where: { id: studentId },
              data: { ratingTotal: { increment: ratingDelta } },
            }),
          ]
        : []),
    ]);

    return submission as SubmissionWithRelations;
  }

  async isGroupMember(userId: string): Promise<boolean> {
    const member = await this.prisma.groupMember.findFirst({
      where: { userId },
      select: { groupId: true },
    });
    return member !== null;
  }

  async getStudentIdsForAdapter(adapterId: string): Promise<string[]> {
    const members = await this.prisma.groupMember.findMany({
      where: {
        group: { adapters: { some: { userId: adapterId } } },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    return members.map((member) => member.userId);
  }

  /**
   * Все кураторы всех групп, в которых состоит студент. Нужно для рассылки
   * пуш-уведомления «студент сдал работу».
   */
  async getAdapterIdsForStudent(studentId: string): Promise<string[]> {
    const adapters = await this.prisma.groupAdapter.findMany({
      where: {
        group: { members: { some: { userId: studentId } } },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    return adapters.map((adapter) => adapter.userId);
  }

  private calculateRatingDelta(
    oldStatus: SubmissionStatus,
    newStatus: SubmissionStatus,
    points: number,
  ): number {
    const wasApproved = oldStatus === SubmissionStatus.approved;
    const nowApproved = newStatus === SubmissionStatus.approved;

    if (!wasApproved && nowApproved) return points;
    if (wasApproved && !nowApproved) return -points;
    return 0;
  }
}
