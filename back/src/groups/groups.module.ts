import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsRepository } from './groups.repository';
import { SharedAuthModule } from '../auth/shared-auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SharedAuthModule, UsersModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsRepository],
  exports: [GroupsService],
})
export class GroupsModule {}
