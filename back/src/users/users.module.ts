import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersMeController } from './users-me.controller';
import { UsersRepository } from './users.repository';
import { SharedAuthModule } from '../auth/shared-auth.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [SharedAuthModule, forwardRef(() => GroupsModule)],
  providers: [UsersService, UsersRepository],
  controllers: [UsersMeController, UsersController],
  exports: [UsersService],
})
export class UsersModule {}
