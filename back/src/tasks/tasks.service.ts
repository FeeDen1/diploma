import { Injectable } from '@nestjs/common';
import { TasksRepository, TaskWithFile } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { S3Service } from '../s3/s3.service';

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
    });
  }

  async getAllTasks(): Promise<TaskWithFile[]> {
    return this.tasksRepository.findAll();
  }

  async getTaskById(id: string): Promise<TaskWithFile> {
    const task = await this.tasksRepository.findById(id);
    if (!task) {
      throw new EntityNotFoundException('Task', id);
    }
    return task;
  }

  async updateTask(id: string, dto: UpdateTaskDto): Promise<TaskWithFile> {
    await this.getTaskById(id);
    return this.tasksRepository.update(id, {
      ...dto,
      taskFileId: dto.taskFileId === null ? null : dto.taskFileId,
    });
  }

  async deleteTask(id: string): Promise<void> {
    await this.getTaskById(id);
    await this.tasksRepository.delete(id);
  }

  getTaskFileUrl(task: TaskWithFile): string | null {
    if (!task.taskFile) return null;
    return this.s3Service.getPublicUrl(task.taskFile.objectKey);
  }
}
