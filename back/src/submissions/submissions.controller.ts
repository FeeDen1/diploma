import {
  Body,
  Controller,
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
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ReadSubmissionDto } from './dto/read-submission.dto';
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
    summary: 'Сдать задание (student / adapter-участник группы)',
  })
  @ApiResponse({ status: 201, type: ReadSubmissionDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.student, UserRole.adapter)
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

  @ApiOperation({ summary: 'Мои сдачи (student / adapter-участник группы)' })
  @ApiResponse({ status: 200, type: [ReadSubmissionDto] })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.student, UserRole.adapter)
  @Get('my')
  async getMy(@CurrentUser() user: TokenPayload): Promise<ReadSubmissionDto[]> {
    const submissions = await this.submissionsService.getMySubmissions(user.id);
    return submissions.map((s) =>
      ReadSubmissionDto.fromEntity(s, this.submissionsService.getFileUrls(s)),
    );
  }

  @ApiOperation({
    summary: 'Сдачи по заданию (admin: все, adapter: свои группы)',
  })
  @ApiResponse({ status: 200, type: [ReadSubmissionDto] })
  @ApiQuery({ name: 'taskId', type: String, description: 'ID задания' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.adapter)
  @Get()
  async getByTask(
    @Query('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ReadSubmissionDto[]> {
    const submissions = await this.submissionsService.getSubmissionsByTaskId(
      taskId,
      user,
    );
    return submissions.map((s) =>
      ReadSubmissionDto.fromEntity(s, this.submissionsService.getFileUrls(s)),
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
}
