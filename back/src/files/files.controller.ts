import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileType, UserRole } from '../../generated/prisma/client';
import { FilesService } from './files.service';
import { ReadFileDto } from './dto/read-file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TokenPayload } from '../auth/interfaces/token-payload.interface';

@ApiTags('Файлы')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiOperation({ summary: 'Загрузить файл' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiQuery({ name: 'type', enum: FileType, description: 'Тип файла' })
  @ApiResponse({ status: 201, type: ReadFileDto })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post()
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: FileType,
    @CurrentUser() user: TokenPayload,
  ): Promise<ReadFileDto> {
    const saved = await this.filesService.upload(
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      type,
      user.id,
    );
    return ReadFileDto.fromEntity(saved, this.filesService.getFileUrl(saved));
  }

  @ApiOperation({ summary: 'Получить файл по ID' })
  @ApiResponse({ status: 200, type: ReadFileDto })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ReadFileDto> {
    const file = await this.filesService.getFileById(id);
    return ReadFileDto.fromEntity(file, this.filesService.getFileUrl(file));
  }

  @ApiOperation({ summary: 'Удалить файл (владелец или admin)' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    await this.filesService.deleteFile(
      id,
      user.id,
      user.role === UserRole.admin,
    );
  }
}
