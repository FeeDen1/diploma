import { Module } from '@nestjs/common';
import { SharedAuthModule } from '../auth/shared-auth.module';
import { FilesModule } from '../files/files.module';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { RewardsRepository } from './rewards.repository';

@Module({
  imports: [SharedAuthModule, FilesModule],
  controllers: [RewardsController],
  providers: [RewardsService, RewardsRepository],
  exports: [RewardsService],
})
export class RewardsModule {}
