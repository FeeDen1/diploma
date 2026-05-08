import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { OtpRepository } from './otp.repository';
import { OtpService } from './otp.service';

@Module({
  imports: [MailModule],
  providers: [OtpService, OtpRepository],
  exports: [OtpService],
})
export class OtpModule {}
