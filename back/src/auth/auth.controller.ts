import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { OtpPendingDto } from './dto/otp-pending.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Регистрация — создаёт пользователя в pending и отправляет OTP',
  })
  @ApiResponse({ status: 201, type: OtpPendingDto })
  @Post('registration')
  async registration(@Body() dto: CreateUserDto): Promise<OtpPendingDto> {
    return this.authService.registration(dto);
  }

  @ApiOperation({
    summary: 'Подтверждение OTP — активирует пользователя и выдаёт токены',
  })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @HttpCode(200)
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthResponseDto> {
    return this.authService.verifyOtp(dto);
  }

  @ApiOperation({ summary: 'Перевыпустить OTP-код' })
  @ApiResponse({ status: 200 })
  @HttpCode(200)
  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto): Promise<void> {
    await this.authService.resendOtp(dto.email);
  }

  @ApiOperation({
    summary:
      'Вход. Если email не подтверждён, возвращает OtpPendingDto и шлёт OTP',
  })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto | OtpPendingDto> {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Обновить токены' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto);
  }

  @ApiOperation({ summary: 'Выход' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: { user: { id: string } }): Promise<void> {
    const user = req.user;
    await this.authService.logout(user.id);
  }
}
