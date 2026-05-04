import {
  Body, Controller, Delete, Get, Param,
  ParseUUIDPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { ReadGroupDto } from './dto/read-group.dto';
import { ReadGroupDetailDto } from './dto/read-group-detail.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AddAdapterDto } from './dto/add-adapter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Группы')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @ApiOperation({ summary: 'Создать группу (admin)' })
  @ApiResponse({ status: 201, type: ReadGroupDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Post()
  async create(@Body() dto: CreateGroupDto): Promise<ReadGroupDto> {
    const group = await this.groupsService.createGroup(dto);
    return ReadGroupDto.fromEntity(group);
  }

  @ApiOperation({ summary: 'Получить все группы' })
  @ApiResponse({ status: 200, type: [ReadGroupDto] })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(): Promise<ReadGroupDto[]> {
    const groups = await this.groupsService.getAllGroups();
    return groups.map(ReadGroupDto.fromEntity);
  }

  @ApiOperation({ summary: 'Получить группу по ID (с участниками и кураторами)' })
  @ApiResponse({ status: 200, type: ReadGroupDetailDto })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ReadGroupDetailDto> {
    const group = await this.groupsService.getGroupById(id);
    return ReadGroupDetailDto.fromEntity(group);
  }

  @ApiOperation({ summary: 'Обновить группу (admin)' })
  @ApiResponse({ status: 200, type: ReadGroupDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<ReadGroupDto> {
    const group = await this.groupsService.updateGroup(id, dto);
    return ReadGroupDto.fromEntity(group);
  }

  @ApiOperation({ summary: 'Удалить группу (admin)' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.groupsService.deleteGroup(id);
  }

  @ApiOperation({ summary: 'Добавить участника в группу (admin)' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Post(':id/members')
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
  ): Promise<void> {
    await this.groupsService.addMember(id, dto.userId);
  }

  @ApiOperation({ summary: 'Удалить участника из группы (admin)' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.groupsService.removeMember(id, userId);
  }

  @ApiOperation({ summary: 'Назначить куратора на группу (admin)' })
  @ApiResponse({ status: 201 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Post(':id/adapters')
  async addAdapter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddAdapterDto,
  ): Promise<void> {
    await this.groupsService.addAdapter(id, dto.userId);
  }

  @ApiOperation({ summary: 'Убрать куратора из группы (admin)' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Delete(':id/adapters/:userId')
  async removeAdapter(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.groupsService.removeAdapter(id, userId);
  }
}
