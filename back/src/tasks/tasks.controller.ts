import {
  Body,
  Controller,
  Delete,
  Get,
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
import { UserRole } from '../../generated/prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReadTaskDto } from './dto/read-task.dto';
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
      'Получить задания (student — только активные, admin/adapter — включая просроченные)',
  })
  @ApiResponse({ status: 200, type: [ReadTaskDto] })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@CurrentUser() user: TokenPayload): Promise<ReadTaskDto[]> {
    const tasks = await this.tasksService.getAllTasks(user);
    return tasks.map((t) =>
      ReadTaskDto.fromEntity(t, this.tasksService.getTaskFileUrl(t)),
    );
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
}
