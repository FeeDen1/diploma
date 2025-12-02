import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { TasksScheduler } from './tasks.scheduler';
import { SharedAuthModule } from '../auth/shared-auth.module';

@Module({
  imports: [SharedAuthModule],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, TasksScheduler],
  exports: [TasksService, TasksRepository],
})
export class TasksModule {}
