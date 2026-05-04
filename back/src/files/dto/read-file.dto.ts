import { ApiProperty } from '@nestjs/swagger';
import { File, FileType, FileVisibility } from '../../../generated/prisma/client';

export class ReadFileDto {
  @ApiProperty({ example: 'uuid', description: 'Уникальный идентификатор файла' })
  readonly id: string;

  @ApiProperty({ example: 'uuid', description: 'ID владельца файла' })
  readonly ownerUserId: string;

  @ApiProperty({ enum: FileType, example: 'avatar', description: 'Тип файла' })
  readonly type: FileType;

  @ApiProperty({ enum: FileVisibility, example: 'public', description: 'Видимость файла' })
  readonly visibility: FileVisibility;

  @ApiProperty({ example: 'image/png', description: 'MIME-тип файла' })
  readonly mimeType: string;

  @ApiProperty({ example: 102400, description: 'Размер файла в байтах' })
  readonly sizeBytes: number;

  @ApiProperty({ example: 'https://storage.yandexcloud.net/pm-task/avatars/uuid.png', description: 'Публичная ссылка' })
  readonly url: string;

  @ApiProperty({ description: 'Дата загрузки' })
  readonly createdAt: Date;

  static fromEntity(file: File, url: string): ReadFileDto {
    return Object.assign(new ReadFileDto(), {
      id: file.id,
      ownerUserId: file.ownerUserId,
      type: file.type,
      visibility: file.visibility,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      url,
      createdAt: file.createdAt,
    });
  }
}
