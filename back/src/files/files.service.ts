import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { File, FileType } from '../../generated/prisma/client';
import { FilesRepository } from './files.repository';
import { S3Service } from '../s3/s3.service';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { DomainValidationException } from '../common/exceptions/validation.exception';
import { ForbiddenException } from '../common/exceptions/forbidden.exception';

const WEB_SAFE_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];
const APPLE_HEIC = ['image/heic', 'image/heif'];

/**
 * Разрешённые mime-типы по назначению файла:
 *  - avatar: web-safe + HEIC (iPhone по умолчанию снимает в HEIC);
 *  - task: только web-safe — обложка задания должна корректно отображаться
 *    в любом клиенте (Android, web, не-Apple устройства);
 *  - submission: web-safe + HEIC + GIF + PDF (студент прикладывает что угодно).
 */
const ALLOWED_MIME_TYPES_BY_TYPE: Record<FileType, readonly string[]> = {
  avatar: [...WEB_SAFE_IMAGES, ...APPLE_HEIC],
  task: WEB_SAFE_IMAGES,
  submission: [
    ...WEB_SAFE_IMAGES,
    ...APPLE_HEIC,
    'image/gif',
    'application/pdf',
  ],
  reward: WEB_SAFE_IMAGES,
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const TYPE_FOLDERS: Record<FileType, string> = {
  avatar: 'avatars',
  task: 'tasks',
  submission: 'submissions',
  reward: 'rewards',
};

@Injectable()
export class FilesService {
  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly s3Service: S3Service,
  ) {}

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    size: number,
    type: FileType,
    ownerUserId: string,
  ): Promise<File> {
    const allowed = ALLOWED_MIME_TYPES_BY_TYPE[type];
    if (!allowed.includes(mimeType)) {
      throw new DomainValidationException(
        `Недопустимый тип файла для ${type}: ${mimeType}. Разрешены: ${allowed.join(', ')}`,
      );
    }

    if (size > MAX_FILE_SIZE) {
      throw new DomainValidationException(
        `Файл слишком большой. Максимум: ${MAX_FILE_SIZE / 1024 / 1024} МБ`,
      );
    }

    const ext = extname(originalName) || '.bin';
    const objectKey = `${TYPE_FOLDERS[type]}/${randomUUID()}${ext}`;

    await this.s3Service.upload(buffer, objectKey, mimeType);

    return this.filesRepository.create({
      ownerUserId,
      bucket: this.s3Service.getBucket(),
      objectKey,
      mimeType,
      sizeBytes: size,
      type,
    });
  }

  async getFileById(id: string): Promise<File> {
    const file = await this.filesRepository.findById(id);
    if (!file) {
      throw new EntityNotFoundException('File', id);
    }
    return file;
  }

  /**
   * Проверяет, что файл существует, принадлежит указанному пользователю
   * и имеет ожидаемый тип. Возвращает сам файл для дальнейшего использования.
   */
  async assertOwnedAndType(
    fileId: string,
    ownerUserId: string,
    expectedType: FileType,
  ): Promise<File> {
    const file = await this.getFileById(fileId);

    if (file.ownerUserId !== ownerUserId) {
      throw new ForbiddenException('Файл принадлежит другому пользователю');
    }

    if (file.type !== expectedType) {
      throw new DomainValidationException(
        `Ожидался файл типа ${expectedType}, получен ${file.type}`,
      );
    }

    return file;
  }

  async deleteFile(
    id: string,
    requestUserId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const file = await this.getFileById(id);

    if (!isAdmin && file.ownerUserId !== requestUserId) {
      throw new ForbiddenException(
        'Удалять файл может только владелец или администратор',
      );
    }

    await this.s3Service.delete(file.objectKey);
    await this.filesRepository.delete(id);
  }

  getFileUrl(file: File): string {
    return this.s3Service.getPublicUrl(file.objectKey);
  }
}
