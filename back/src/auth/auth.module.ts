import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { SharedAuthModule } from './shared-auth.module';
import { UsersModule } from '../users/users.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [SharedAuthModule, UsersModule, OtpModule],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokensRepository],
  exports: [AuthService],
})
export class AuthModule {}
