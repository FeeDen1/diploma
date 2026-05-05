import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma } from '../../generated/prisma/client';

const WITH_FILE = { taskFile: true } satisfies Prisma.TaskInclude;

export type TaskWithFile = Prisma.TaskGetPayload<{ include: typeof WITH_FILE }>;

export interface FindTasksOptions {
  /** Включать архивированные (soft-deleted) задания */
  includeArchived?: boolean;
  /** Включать задания с истёкшим сроком */
  includeExpired?: boolean;
  /** Текущее время для фильтрации по сроку (по умолчанию now()) */
  now?: Date;
}

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TaskUncheckedCreateInput): Promise<TaskWithFile> {
    return this.prisma.task.create({ data, include: WITH_FILE });
  }

  async findAll(options: FindTasksOptions = {}): Promise<TaskWithFile[]> {
    return this.prisma.task.findMany({
      where: this.buildVisibilityWhere(options),
      orderBy: { createdAt: 'desc' },
      include: WITH_FILE,
    });
  }

  async findById(
    id: string,
    options: FindTasksOptions = {},
  ): Promise<TaskWithFile | null> {
    return this.prisma.task.findFirst({
      where: { id, ...this.buildVisibilityWhere(options) },
      include: WITH_FILE,
    });
  }

  async update(
    id: string,
    data: Prisma.TaskUncheckedUpdateInput,
  ): Promise<TaskWithFile> {
    return this.prisma.task.update({ where: { id }, data, include: WITH_FILE });
  }

  /**
   * Soft delete: проставляет archivedAt вместо физического удаления.
   * Сабмиты и баллы пользователей сохраняются.
   */
  async archive(
    id: string,
    archivedAt: Date = new Date(),
  ): Promise<TaskWithFile> {
    return this.prisma.task.update({
      where: { id },
      data: { archivedAt },
      include: WITH_FILE,
    });
  }

  /**
   * Массовая архивация заданий с истёкшим сроком.
   * Используется кроном.
   */
  async archiveExpired(now: Date = new Date()): Promise<{ count: number }> {
    return this.prisma.task.updateMany({
      where: {
        expiresAt: { lt: now },
        archivedAt: null,
      },
      data: { archivedAt: now },
    });
  }

  private buildVisibilityWhere(
    options: FindTasksOptions,
  ): Prisma.TaskWhereInput {
    const where: Prisma.TaskWhereInput = {};

    if (!options.includeArchived) {
      where.archivedAt = null;
    }

    if (!options.includeExpired) {
      const now = options.now ?? new Date();
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
    }

    return where;
  }
}
