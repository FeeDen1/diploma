import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma, TaskCategory } from '../../generated/prisma/client';
import type { TasksSort } from './dto/list-tasks-query.dto';

const WITH_FILE = { taskFile: true } satisfies Prisma.TaskInclude;

export type TaskWithFile = Prisma.TaskGetPayload<{ include: typeof WITH_FILE }>;

export interface FindTasksOptions {
  /** Включать архивированные (soft-deleted) задания */
  includeArchived?: boolean;
  /** Включать задания с истёкшим сроком */
  includeExpired?: boolean;
  /** Текущее время для фильтрации по сроку (по умолчанию now()) */
  now?: Date;
  /** Фильтр по категории */
  category?: TaskCategory;
}

export interface PaginatedTasksOptions extends FindTasksOptions {
  sort?: TasksSort;
  limit: number;
  offset: number;
}

const SORT_ORDER: Record<TasksSort, Prisma.TaskOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  'points-desc': [{ points: 'desc' }, { createdAt: 'desc' }],
  'points-asc': [{ points: 'asc' }, { createdAt: 'desc' }],
};

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

  async findAndCount(
    options: PaginatedTasksOptions,
  ): Promise<{ items: TaskWithFile[]; total: number }> {
    const where = this.buildVisibilityWhere(options);
    const orderBy = SORT_ORDER[options.sort ?? 'newest'];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy,
        include: WITH_FILE,
        skip: options.offset,
        take: options.limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { items, total };
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
   * Снимает архив. Если у задания истёк срок — крон вернёт его в архив на
   * следующем тике. Чтобы этого избежать, перед восстановлением имеет смысл
   * продлить или убрать expiresAt — это решается в сервисе.
   */
  async unarchive(id: string): Promise<TaskWithFile> {
    return this.prisma.task.update({
      where: { id },
      data: { archivedAt: null },
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

    if (options.category) {
      where.category = options.category;
    }

    return where;
  }
}
