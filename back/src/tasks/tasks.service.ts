import { Injectable, Logger } from '@nestjs/common';
import { TasksRepository, TaskForUser, TaskWithFile } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto, TasksSort } from './dto/list-tasks-query.dto';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { DomainValidationException } from '../common/exceptions/validation.exception';
import { S3Service } from '../s3/s3.service';
import { UserRole } from '../../generated/prisma/client';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createTask(dto: CreateTaskDto): Promise<TaskWithFile> {
    return this.tasksRepository.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      category: dto.category,
      points: dto.points,
      taskFileId: dto.taskFileId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  async getAllTasks(_user: TokenPayload): Promise<TaskWithFile[]> {
    return this.tasksRepository.findAll(this.visibilityFor());
  }

  async listTasks(
    user: TokenPayload,
    query: ListTasksQueryDto,
  ): Promise<{
    items: TaskForUser[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const sort: TasksSort = query.sort ?? 'deadline';

    // Перед чтением «прибиваем» просрочку — крон тикает раз в час, а
    // пользователь должен видеть актуальную картину сразу. Это дешёвый
    // updateMany по индексу expiresAt.
    await this.tasksRepository.archiveExpired();

    // Архив видит только admin. Студент и куратор флаг игнорируют.
    const includeArchived =
      user.role === UserRole.admin && query.includeArchived === true;

    const { items, total } = await this.tasksRepository.findAndCountForUser({
      userId: user.id,
      includeArchived,
      // Просрочку archiveExpired() уже перевела в архив, поэтому отдельно
      // включать просроченные не нужно — для всех ролей includeExpired=false.
      includeExpired: false,
      categories: query.categories,
      states: query.states,
      temporalOnly: query.temporalOnly,
      sort,
      limit,
      offset,
    });
    return { items, total, limit, offset };
  }

  /**
   * Получает задание по ID с учётом прав текущего пользователя.
   * Студенты не видят архивированные/просроченные — для них такие задания «не существуют».
   * Для бизнес-логики (например, проверка существования при сдаче) используется getActiveTaskById.
   */
  async getTaskById(id: string, _user: TokenPayload): Promise<TaskWithFile> {
    const task = await this.tasksRepository.findById(id, this.visibilityFor());
    if (!task) {
      throw new EntityNotFoundException('Task', id);
    }
    return task;
  }

  /**
   * Возвращает задание независимо от его видимости. Используется во внутренних
   * операциях, где видимость задания проверяется отдельно (например, в SubmissionsService
   * для разделения 404 «нет задания» и 400 «срок истёк»).
   */
  async getTaskByIdRaw(id: string): Promise<TaskWithFile> {
    const task = await this.tasksRepository.findById(id, {
      includeArchived: true,
      includeExpired: true,
    });
    if (!task) {
      throw new EntityNotFoundException('Task', id);
    }
    return task;
  }

  async updateTask(id: string, dto: UpdateTaskDto): Promise<TaskWithFile> {
    await this.getTaskByIdRaw(id);
    return this.tasksRepository.update(id, {
      ...dto,
      taskFileId: dto.taskFileId === null ? null : dto.taskFileId,
      expiresAt:
        dto.expiresAt === null
          ? null
          : dto.expiresAt
            ? new Date(dto.expiresAt)
            : undefined,
    });
  }

  /**
   * Soft delete: задание переходит в архив, но физически не удаляется.
   * Сабмиты и баллы студентов сохраняются.
   */
  async archiveTask(id: string): Promise<void> {
    await this.getTaskByIdRaw(id);
    await this.tasksRepository.archive(id);
  }

  /**
   * Физическое удаление задания. Разрешено только из архива — активное
   * задание сначала архивируется. Начисленные за approved-сабмиты баллы
   * снимаются с рейтинга студентов (см. deleteWithRatingRollback).
   */
  async deleteTask(id: string): Promise<void> {
    const task = await this.getTaskByIdRaw(id);
    if (!task.archivedAt) {
      throw new DomainValidationException(
        'Удалять можно только архивные задания. Сначала отправьте задание в архив.',
      );
    }
    const objectKeys = await this.tasksRepository.deleteWithRatingRollback(id);

    // S3 внешний и нетранзакционный: чистим уже после коммита БД. Ошибку не
    // пробрасываем — БД консистентна, максимум останется осиротевший объект.
    await Promise.all(
      objectKeys.map((key) =>
        this.s3Service.delete(key).catch((err: unknown) => {
          this.logger.warn(
            `Не удалось удалить объект S3 "${key}" при удалении задания ${id}: ${String(err)}`,
          );
        }),
      ),
    );
  }

  /**
   * Возвращает архивное задание в активный список. Если у задания просрочен
   * expiresAt — крон снова его архивирует, поэтому при восстановлении
   * автоматически снимаем срок (admin вправе выставить новый при необходимости).
   */
  async unarchiveTask(id: string): Promise<TaskWithFile> {
    const task = await this.getTaskByIdRaw(id);
    if (!task.archivedAt) {
      return task;
    }
    if (task.expiresAt && task.expiresAt.getTime() <= Date.now()) {
      await this.tasksRepository.update(id, { expiresAt: null });
    }
    return this.tasksRepository.unarchive(id);
  }

  getTaskFileUrl(task: TaskWithFile): string | null {
    if (!task.taskFile) return null;
    return this.s3Service.getPublicUrl(task.taskFile.objectKey);
  }

  /**
   * Правила видимости заданий:
   *  - все роли: видят только не-архив. Просрочка перед чтением физически
   *    архивируется в listTasks, поэтому понятие «просроченное активное»
   *    в выдаче не существует.
   *  - admin может включить архив через includeArchived в query.
   */
  private visibilityFor() {
    return {
      includeArchived: false,
      includeExpired: false,
    };
  }
}
