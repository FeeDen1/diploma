import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { File, FileType } from '../../generated/prisma/client';
import { FilesRepository } from './files.repository';
import { S3Service } from '../s3/s3.service';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { DomainValidationException } from '../common/exceptions/validation.exception';
import { ForbiddenException } from '../common/exceptions/forbidden.exception';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const TYPE_FOLDERS: Record<FileType, string> = {
  avatar: 'avatars',
  task: 'tasks',
  submission: 'submissions',
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
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new DomainValidationException(
        `Недопустимый тип файла: ${mimeType}. Разрешены: ${ALLOWED_MIME_TYPES.join(', ')}`,
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

  async deleteFile(id: string, requestUserId: string, isAdmin: boolean): Promise<void> {
    const file = await this.getFileById(id);

    if (!isAdmin && file.ownerUserId !== requestUserId) {
      throw new ForbiddenException('Удалять файл может только владелец или администратор');
    }

    await this.s3Service.delete(file.objectKey);
    await this.filesRepository.delete(id);
  }

  getFileUrl(file: File): string {
    return this.s3Service.getPublicUrl(file.objectKey);
  }
}
