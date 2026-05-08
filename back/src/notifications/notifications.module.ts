import { Module } from '@nestjs/common';
import { SharedAuthModule } from '../auth/shared-auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { ExpoPushService } from './expo-push.service';

@Module({
  imports: [SharedAuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, ExpoPushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
