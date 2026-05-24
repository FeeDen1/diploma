import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma, TaskCategory } from '../../generated/prisma/client';
import type { TasksSort } from './dto/list-tasks-query.dto';
import type { AchievementStatus } from './dto/achievement-status';

const WITH_FILE = { taskFile: true } satisfies Prisma.TaskInclude;

export type TaskWithFile = Prisma.TaskGetPayload<{ include: typeof WITH_FILE }>;

/** Задание + вычисленный статус относительно конкретного пользователя. */
export type TaskForUser = TaskWithFile & {
  achievementStatus: AchievementStatus;
};

export interface FindTasksOptions {
  /** Включать архивированные (soft-deleted) задания */
  includeArchived?: boolean;
  /** Включать задания с истёкшим сроком */
  includeExpired?: boolean;
  /** Текущее время для фильтрации по сроку (по умолчанию now()) */
  now?: Date;
}

/** Параметры постраничной выборки заданий для конкретного пользователя. */
export interface FindTasksForUserOptions {
  userId: string;
  includeArchived: boolean;
  includeExpired: boolean;
  categories?: TaskCategory[];
  states?: AchievementStatus[];
  temporalOnly?: boolean;
  sort: TasksSort;
  limit: number;
  offset: number;
}

/**
 * Вторичная сортировка (после «засчитанные — вниз»). SQL-фрагменты, потому
 * что основной запрос постранично гоняется через $queryRaw.
 *
 * deadline: сначала задания с ближайшим сроком (меньше оставшегося времени —
 * выше), бессрочные (expires_at IS NULL) уходят в конец. now() для всех строк
 * запроса одинаков, поэтому сортировка по expires_at эквивалентна сортировке
 * по оставшемуся времени.
 */
const SECONDARY_SORT: Record<TasksSort, Prisma.Sql> = {
  deadline: Prisma.sql`t.expires_at ASC NULLS LAST, t.created_at DESC`,
  newest: Prisma.sql`t.created_at DESC`,
  oldest: Prisma.sql`t.created_at ASC`,
  'points-desc': Prisma.sql`t.points DESC, t.created_at DESC`,
  'points-asc': Prisma.sql`t.points ASC, t.created_at DESC`,
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

  /**
   * Постраничная выборка заданий с вычисленным статусом для конкретного юзера.
   *
   * Статус (available/pending/approved/rejected) нельзя посчитать в Prisma
   * query-API — он требует LEFT JOIN на сабмишены юзера и ORDER BY по
   * вычисленному полю. Поэтому отбор id + сортировка + фильтры идут raw SQL,
   * а «гидрация» (подтягивание taskFile-relation) — обычным Prisma findMany.
   *
   * Сортировка всегда: «засчитанные — в самый конец», внутри — выбранный sort.
   */
  async findAndCountForUser(
    options: FindTasksForUserOptions,
  ): Promise<{ items: TaskForUser[]; total: number }> {
    // Выражение вычисляемого статуса. Используется и в SELECT, и в WHERE,
    // и в ORDER BY — поэтому вынесено в общий фрагмент.
    const stateExpr = Prisma.sql`COALESCE(s.status::text, 'available')`;

    // LEFT JOIN сабмишена ТЕКУЩЕГО юзера. Пара (task_id, student_id)
    // уникальна (@@unique в схеме) — на задание максимум одна строка,
    // дублей от JOIN не будет.
    const fromJoin = Prisma.sql`
      FROM tasks t
      LEFT JOIN task_submissions s
        ON s.task_id = t.id AND s.student_id = ${options.userId}::uuid
    `;

    const conditions: Prisma.Sql[] = [];
    if (!options.includeArchived) {
      conditions.push(Prisma.sql`t.archived_at IS NULL`);
    }
    if (!options.includeExpired) {
      conditions.push(
        Prisma.sql`(t.expires_at IS NULL OR t.expires_at > now())`,
      );
    }
    if (options.categories && options.categories.length > 0) {
      conditions.push(
        Prisma.sql`t.category::text IN (${Prisma.join(options.categories)})`,
      );
    }
    if (options.temporalOnly) {
      conditions.push(Prisma.sql`t.expires_at IS NOT NULL`);
    }
    if (options.states && options.states.length > 0) {
      conditions.push(
        Prisma.sql`${stateExpr} IN (${Prisma.join(options.states)})`,
      );
    }

    const whereSql =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    // 1. Отбираем id заданий в нужном порядке (с фильтрами и пагинацией).
    const rows = await this.prisma.$queryRaw<
      { id: string; state: string }[]
    >(Prisma.sql`
      SELECT t.id AS id, ${stateExpr} AS state
      ${fromJoin}
      ${whereSql}
      ORDER BY (${stateExpr} = 'approved') ASC, ${SECONDARY_SORT[options.sort]}
      LIMIT ${options.limit} OFFSET ${options.offset}
    `);

    // 2. Считаем общее количество под те же фильтры (для пагинации).
    const countRows = await this.prisma.$queryRaw<
      { count: bigint }[]
    >(Prisma.sql`
      SELECT COUNT(*) AS count
      ${fromJoin}
      ${whereSql}
    `);
    const total = Number(countRows[0]?.count ?? 0);

    if (rows.length === 0) {
      return { items: [], total };
    }

    // 3. «Гидрация»: подтягиваем полные задания с taskFile-relation.
    const ids = rows.map((row) => row.id);
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: ids } },
      include: WITH_FILE,
    });
    const taskById = new Map(tasks.map((task) => [task.id, task]));

    // 4. Восстанавливаем порядок из raw-запроса и приклеиваем статус.
    const items: TaskForUser[] = [];
    for (const row of rows) {
      const task = taskById.get(row.id);
      if (task) {
        items.push({
          ...task,
          achievementStatus: row.state as AchievementStatus,
        });
      }
    }

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

    return where;
  }
}
