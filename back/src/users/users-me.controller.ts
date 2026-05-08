import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ReadUserDto } from './dto/read-user.dto';
import { SetAvatarDto } from './dto/set-avatar.dto';
import { MyGroupsDto } from './dto/my-groups.dto';
import { GroupsService } from '../groups/groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TokenPayload } from '../auth/interfaces/token-payload.interface';

@ApiTags('Пользователи')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersMeController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => GroupsService))
    private readonly groupsService: GroupsService,
  ) {}

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

  @ApiOperation({
    summary: 'Группы текущего пользователя: где состоит и где курирует',
  })
  @ApiResponse({ status: 200, type: MyGroupsDto })
  @Get('groups')
  async getMyGroups(
    @CurrentUser() currentUser: TokenPayload,
  ): Promise<MyGroupsDto> {
    const { memberOf, curatorOf } = await this.usersService.getMyGroups(
      currentUser.id,
    );
    return MyGroupsDto.create(memberOf, curatorOf);
  }

  @ApiOperation({
    summary: 'Присоединиться к группе (онбординг студента)',
  })
  @ApiResponse({ status: 201 })
  @Post('groups/:groupId')
  async joinGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() currentUser: TokenPayload,
  ): Promise<void> {
    await this.groupsService.addMember(groupId, currentUser.id);
  }

  @ApiOperation({ summary: 'Покинуть группу' })
  @ApiResponse({ status: 200 })
  @Delete('groups/:groupId')
  async leaveGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() currentUser: TokenPayload,
  ): Promise<void> {
    await this.groupsService.removeMember(groupId, currentUser.id);
  }
}
