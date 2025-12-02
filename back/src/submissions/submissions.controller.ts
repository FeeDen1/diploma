import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import { SubmissionsService } from './submissions.service';
import type { SubmissionWithRelations } from './submissions.repository';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ReadSubmissionDto } from './dto/read-submission.dto';
import { MySubmissionDto } from './dto/my-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TokenPayload } from '../auth/interfaces/token-payload.interface';

@ApiTags('Сдачи заданий')
@ApiBearerAuth()
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @ApiOperation({
    summary:
      'Сдать задание (student, adapter-участник группы, admin для тестов)',
  })
  @ApiResponse({ status: 201, type: ReadSubmissionDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.student, UserRole.adapter, UserRole.admin)
  @Post()
  async create(
    @Body() dto: CreateSubmissionDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<ReadSubmissionDto> {
    const submission = await this.submissionsService.createSubmission(
      dto.taskId,
      user,
      dto.submissionFileId,
    );
    return ReadSubmissionDto.fromEntity(
      submission,
      this.submissionsService.getFileUrls(submission),
    );
  }

  @ApiOperation({
    summary: 'Мои сдачи (компактный список без блока пользователя)',
  })
  @ApiResponse({ status: 200, type: [MySubmissionDto] })
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMy(@CurrentUser() user: TokenPayload): Promise<MySubmissionDto[]> {
    const submissions = await this.submissionsService.getMySubmissions(user.id);
    return submissions.map((submission) => {
      const urls = this.submissionsService.getFileUrls(submission);
      return MySubmissionDto.fromEntity(submission, {
        submissionFileUrl: urls.submissionFileUrl,
        taskFileUrl: urls.taskFileUrl,
      });
    });
  }

  @ApiOperation({
    summary:
      'Сдачи: фильтр по taskId или studentId (admin: всё, adapter: свои группы)',
  })
  @ApiResponse({ status: 200, type: [ReadSubmissionDto] })
  @ApiQuery({ name: 'taskId', required: false, type: String })
  @ApiQuery({ name: 'studentId', required: false, type: String })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.adapter)
  @Get()
  async getList(
    @CurrentUser() user: TokenPayload,
    @Query('taskId') taskId?: string,
    @Query('studentId') studentId?: string,
  ): Promise<ReadSubmissionDto[]> {
    if (!taskId && !studentId) {
      throw new BadRequestException('Нужен taskId или studentId');
    }

    const submissions: SubmissionWithRelations[] = taskId
      ? await this.submissionsService.getSubmissionsByTaskId(taskId, user)
      : await this.submissionsService.getSubmissionsByStudentId(
          studentId as string,
          user,
        );

    return submissions.map((submission) =>
      ReadSubmissionDto.fromEntity(
        submission,
        this.submissionsService.getFileUrls(submission),
      ),
    );
  }

  @ApiOperation({ summary: 'Сдача по ID (admin/adapter)' })
  @ApiResponse({ status: 200, type: ReadSubmissionDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.adapter)
  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ReadSubmissionDto> {
    const submission = await this.submissionsService.getSubmissionById(
      id,
      user,
    );
    return ReadSubmissionDto.fromEntity(
      submission,
      this.submissionsService.getFileUrls(submission),
    );
  }

  @ApiOperation({ summary: 'Изменить статус сдачи (admin/adapter)' })
  @ApiResponse({ status: 200, type: ReadSubmissionDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.adapter)
  @Patch(':id/status')
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<ReadSubmissionDto> {
    const submission = await this.submissionsService.changeStatus(
      id,
      dto.status,
      user,
    );
    return ReadSubmissionDto.fromEntity(
      submission,
      this.submissionsService.getFileUrls(submission),
    );
  }

  @ApiOperation({
    summary:
      'Перезалить файл-доказательство в своей сдаче (статус снова pending)',
  })
  @ApiResponse({ status: 200, type: ReadSubmissionDto })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateMine(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubmissionDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<ReadSubmissionDto> {
    const submission = await this.submissionsService.replaceMyFile(
      id,
      dto.submissionFileId,
      user,
    );
    return ReadSubmissionDto.fromEntity(
      submission,
      this.submissionsService.getFileUrls(submission),
    );
  }

  @ApiOperation({
    summary: 'Удалить свою сдачу (только владелец, только pending)',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteMine(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    await this.submissionsService.deleteMySubmission(id, user);
  }
}
