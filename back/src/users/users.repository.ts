import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma } from '../../generated/prisma/client';

const WITH_AVATAR = { avatarFile: true } satisfies Prisma.UserInclude;

export type UserWithAvatar = Prisma.UserGetPayload<{ include: typeof WITH_AVATAR }>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<UserWithAvatar> {
    return this.prisma.user.create({ data, include: WITH_AVATAR });
  }

  async findAll(): Promise<UserWithAvatar[]> {
    return this.prisma.user.findMany({ include: WITH_AVATAR });
  }

  async findById(id: string): Promise<UserWithAvatar | null> {
    return this.prisma.user.findUnique({ where: { id }, include: WITH_AVATAR });
  }

  async findByEmail(email: string): Promise<UserWithAvatar | null> {
    return this.prisma.user.findUnique({ where: { email }, include: WITH_AVATAR });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<UserWithAvatar> {
    return this.prisma.user.update({ where: { id }, data, include: WITH_AVATAR });
  }
}
