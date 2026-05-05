import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ReadUserDto } from './dto/read-user.dto';
import { SetAvatarDto } from './dto/set-avatar.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TokenPayload } from '../auth/interfaces/token-payload.interface';

@ApiTags('Пользователи')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersMeController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Получить текущего пользователя' })
  @ApiResponse({ status: 200, type: ReadUserDto })
  @Get()
  async getMe(@CurrentUser() currentUser: TokenPayload): Promise<ReadUserDto> {
    const user = await this.usersService.getUserById(currentUser.id);
    return ReadUserDto.fromEntity(user, this.usersService.getAvatarUrl(user));
  }

  @ApiOperation({ summary: 'Установить аватар текущему пользователю' })
  @ApiResponse({ status: 200, type: ReadUserDto })
  @Patch('avatar')
  async setAvatar(
    @Body() dto: SetAvatarDto,
    @CurrentUser() currentUser: TokenPayload,
  ): Promise<ReadUserDto> {
    const user = await this.usersService.setAvatar(currentUser.id, dto.fileId);
    return ReadUserDto.fromEntity(user, this.usersService.getAvatarUrl(user));
  }
}
