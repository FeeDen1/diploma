import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { SubmissionsRepository } from './submissions.repository';
import { SharedAuthModule } from '../auth/shared-auth.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [SharedAuthModule, TasksModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsRepository],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
