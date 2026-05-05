import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersMeController } from './users-me.controller';
import { UsersRepository } from './users.repository';
import { SharedAuthModule } from '../auth/shared-auth.module';

@Module({
  imports: [SharedAuthModule],
  providers: [UsersService, UsersRepository],
  controllers: [UsersMeController, UsersController],
  exports: [UsersService],
})
export class UsersModule {}
