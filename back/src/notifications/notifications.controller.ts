import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { UnregisterDeviceTokenDto } from './dto/unregister-device-token.dto';

@ApiTags('Уведомления')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Зарегистрировать Expo Push Token устройства' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('device-token')
  async register(
    @CurrentUser() user: TokenPayload,
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<void> {
    await this.notificationsService.registerDevice(
      user.id,
      dto.token,
      dto.platform,
    );
  }

  @ApiOperation({ summary: 'Удалить токен устройства (на logout)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('device-token')
  async unregister(@Body() dto: UnregisterDeviceTokenDto): Promise<void> {
    await this.notificationsService.unregisterDevice(dto.token);
  }
}
