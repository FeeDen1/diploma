import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TasksRepository } from './tasks.repository';

/**
 * Периодически архивирует задания, у которых истёк срок действия.
 * Soft delete: задания не удаляются физически, ставится archivedAt.
 * Сабмиты и уже начисленные баллы остаются нетронутыми.
 */
@Injectable()
export class TasksScheduler {
  private readonly logger = new Logger(TasksScheduler.name);

  constructor(private readonly tasksRepository: TasksRepository) {}

  @Cron(CronExpression.EVERY_HOUR, { name: 'archive-expired-tasks' })
  async archiveExpiredTasks(): Promise<void> {
    const result = await this.tasksRepository.archiveExpired();
    if (result.count > 0) {
      this.logger.log(`Archived ${result.count} expired task(s)`);
    }
  }
}
