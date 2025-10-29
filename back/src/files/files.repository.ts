import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { File, Prisma } from '../../generated/prisma/client';

@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.FileUncheckedCreateInput): Promise<File> {
    return this.prisma.file.create({ data });
  }

  async findById(id: string): Promise<File | null> {
    return this.prisma.file.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<File> {
    return this.prisma.file.delete({ where: { id } });
  }
}
