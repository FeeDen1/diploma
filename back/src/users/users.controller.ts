import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ReadUserDto } from './dto/read-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TokenPayload } from '../auth/interfaces/token-payload.interface';

@ApiTags('Пользователи')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Создать пользователя (admin)' })
  @ApiResponse({ status: 201, type: ReadUserDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<ReadUserDto> {
    const user = await this.usersService.createUser(dto);
    return ReadUserDto.fromEntity(user, this.usersService.getAvatarUrl(user));
  }

  @ApiOperation({ summary: 'Получить всех пользователей (admin)' })
  @ApiResponse({ status: 200, type: [ReadUserDto] })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Get()
  async getAll(): Promise<ReadUserDto[]> {
    const users = await this.usersService.getAllUsers();
    return users.map((u) => ReadUserDto.fromEntity(u, this.usersService.getAvatarUrl(u)));
  }

  @ApiOperation({ summary: 'Получить текущего пользователя' })
  @ApiResponse({ status: 200, type: ReadUserDto })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() currentUser: TokenPayload): Promise<ReadUserDto> {
    const user = await this.usersService.getUserById(currentUser.id);
    return ReadUserDto.fromEntity(user, this.usersService.getAvatarUrl(user));
  }

  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiResponse({ status: 200, type: ReadUserDto })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ReadUserDto> {
    const user = await this.usersService.getUserById(id);
    return ReadUserDto.fromEntity(user, this.usersService.getAvatarUrl(user));
  }

  @ApiOperation({ summary: 'Установить аватар текущему пользователю' })
  @ApiResponse({ status: 200, type: ReadUserDto })
  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  async setAvatar(
    @Body('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() currentUser: TokenPayload,
  ): Promise<ReadUserDto> {
    const user = await this.usersService.setAvatar(currentUser.id, fileId);
    return ReadUserDto.fromEntity(user, this.usersService.getAvatarUrl(user));
  }

  @ApiOperation({ summary: 'Изменить роль пользователя (admin)' })
  @ApiResponse({ status: 200, type: ReadUserDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id/role')
  async changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleDto,
  ): Promise<ReadUserDto> {
    const user = await this.usersService.changeRole(id, dto.role);
    return ReadUserDto.fromEntity(user, this.usersService.getAvatarUrl(user));
  }
}
