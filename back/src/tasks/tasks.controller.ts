import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReadTaskDto } from './dto/read-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { PaginatedTasksDto } from './dto/paginated-tasks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TokenPayload } from '../auth/interfaces/token-payload.interface';

@ApiTags('Задания')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Создать задание (admin)' })
  @ApiResponse({ status: 201, type: ReadTaskDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Post()
  async create(@Body() dto: CreateTaskDto): Promise<ReadTaskDto> {
    const task = await this.tasksService.createTask(dto);
    return ReadTaskDto.fromEntity(task, this.tasksService.getTaskFileUrl(task));
  }

  @ApiOperation({
    summary:
      'Получить задания постранично (фильтр category, sort, limit, offset)',
  })
  @ApiResponse({ status: 200, type: PaginatedTasksDto })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(
    @CurrentUser() user: TokenPayload,
    @Query() query: ListTasksQueryDto,
  ): Promise<PaginatedTasksDto> {
    const { items, total, limit, offset } = await this.tasksService.listTasks(
      user,
      query,
    );
    const dtos = items.map((task) =>
      ReadTaskDto.fromEntity(
        task,
        this.tasksService.getTaskFileUrl(task),
        task.achievementStatus,
      ),
    );
    return PaginatedTasksDto.create(dtos, total, limit, offset);
  }

  @ApiOperation({ summary: 'Получить задание по ID' })
  @ApiResponse({ status: 200, type: ReadTaskDto })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ReadTaskDto> {
    const task = await this.tasksService.getTaskById(id, user);
    return ReadTaskDto.fromEntity(task, this.tasksService.getTaskFileUrl(task));
  }

  @ApiOperation({ summary: 'Обновить задание (admin)' })
  @ApiResponse({ status: 200, type: ReadTaskDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<ReadTaskDto> {
    const task = await this.tasksService.updateTask(id, dto);
    return ReadTaskDto.fromEntity(task, this.tasksService.getTaskFileUrl(task));
  }

  @ApiOperation({
    summary: 'Архивировать задание (admin). Сабмиты и баллы сохраняются',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Delete(':id')
  async archive(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tasksService.archiveTask(id);
  }

  @ApiOperation({
    summary:
      'Восстановить архивное задание (admin). Если срок истёк — он снимается',
  })
  @ApiResponse({ status: 200, type: ReadTaskDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id/restore')
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<ReadTaskDto> {
    const task = await this.tasksService.unarchiveTask(id);
    return ReadTaskDto.fromEntity(task, this.tasksService.getTaskFileUrl(task));
  }

  @ApiOperation({
    summary:
      'Удалить архивное задание навсегда (admin). Начисленные за него баллы ' +
      'снимаются с рейтинга студентов. Работает только для архивных заданий',
  })
  @ApiResponse({ status: 204 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/permanent')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tasksService.deleteTask(id);
  }
}
