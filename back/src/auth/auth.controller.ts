import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Регистрация' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @Post('registration')
  async registration(@Body() dto: CreateUserDto): Promise<AuthResponseDto> {
    return this.authService.registration(dto);
  }

  @ApiOperation({ summary: 'Вход' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Обновить токены' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto);
  }

  @ApiOperation({ summary: 'Выход' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: { user: { id: string } }): Promise<void> {
    const user = req.user;
    await this.authService.logout(user.id);
  }
}
