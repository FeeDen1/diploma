import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma } from '../../generated/prisma/client';

const WITH_FILE = { taskFile: true } satisfies Prisma.TaskInclude;

export type TaskWithFile = Prisma.TaskGetPayload<{ include: typeof WITH_FILE }>;

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TaskUncheckedCreateInput): Promise<TaskWithFile> {
    return this.prisma.task.create({ data, include: WITH_FILE });
  }

  async findAll(): Promise<TaskWithFile[]> {
    return this.prisma.task.findMany({ orderBy: { createdAt: 'desc' }, include: WITH_FILE });
  }

  async findById(id: string): Promise<TaskWithFile | null> {
    return this.prisma.task.findUnique({ where: { id }, include: WITH_FILE });
  }

  async update(id: string, data: Prisma.TaskUncheckedUpdateInput): Promise<TaskWithFile> {
    return this.prisma.task.update({ where: { id }, data, include: WITH_FILE });
  }

  async delete(id: string): Promise<TaskWithFile> {
    return this.prisma.task.delete({ where: { id }, include: WITH_FILE });
  }
}
