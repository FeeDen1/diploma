import { Injectable } from '@nestjs/common';
import { TasksRepository, TaskWithFile } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { S3Service } from '../s3/s3.service';
import { UserRole } from '../../generated/prisma/client';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createTask(dto: CreateTaskDto): Promise<TaskWithFile> {
    return this.tasksRepository.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      points: dto.points,
      taskFileId: dto.taskFileId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  async getAllTasks(user: TokenPayload): Promise<TaskWithFile[]> {
    return this.tasksRepository.findAll(this.visibilityFor(user));
  }

  /**
   * Получает задание по ID с учётом прав текущего пользователя.
   * Студенты не видят архивированные/просроченные — для них такие задания «не существуют».
   * Для бизнес-логики (например, проверка существования при сдаче) используется getActiveTaskById.
   */
  async getTaskById(id: string, user: TokenPayload): Promise<TaskWithFile> {
    const task = await this.tasksRepository.findById(
      id,
      this.visibilityFor(user),
    );
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

  getTaskFileUrl(task: TaskWithFile): string | null {
    if (!task.taskFile) return null;
    return this.s3Service.getPublicUrl(task.taskFile.objectKey);
  }

  /**
   * Правила видимости заданий:
   *  - admin / adapter: видят все неархивированные (включая просроченные).
   *  - student: видит только активные (не архив, не просроченные).
   */
  private visibilityFor(user: TokenPayload) {
    const isStaff =
      user.role === UserRole.admin || user.role === UserRole.adapter;
    return {
      includeArchived: false,
      includeExpired: isStaff,
    };
  }
}
