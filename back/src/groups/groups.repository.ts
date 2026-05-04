import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Group, GroupMember, GroupAdapter, User, Prisma } from '../../generated/prisma/client';

export type GroupWithRelations = Group & {
  members: (GroupMember & { user: User })[];
  adapters: (GroupAdapter & { user: User })[];
};

@Injectable()
export class GroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.GroupCreateInput): Promise<Group> {
    return this.prisma.group.create({ data });
  }

  async findAll(): Promise<Group[]> {
    return this.prisma.group.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<GroupWithRelations | null> {
    return this.prisma.group.findUnique({
      where: { id },
      include: {
        members: { include: { user: true }, orderBy: { joinedAt: 'asc' } },
        adapters: { include: { user: true }, orderBy: { assignedAt: 'asc' } },
      },
    }) as Promise<GroupWithRelations | null>;
  }

  async update(id: string, data: Prisma.GroupUpdateInput): Promise<Group> {
    return this.prisma.group.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Group> {
    return this.prisma.group.delete({ where: { id } });
  }

  async findMember(groupId: string, userId: string): Promise<GroupMember | null> {
    return this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  async addMember(groupId: string, userId: string): Promise<GroupMember> {
    return this.prisma.groupMember.create({
      data: { groupId, userId },
    });
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  async findAdapter(groupId: string, userId: string): Promise<GroupAdapter | null> {
    return this.prisma.groupAdapter.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  async addAdapter(groupId: string, userId: string): Promise<GroupAdapter> {
    return this.prisma.groupAdapter.create({
      data: { groupId, userId },
    });
  }

  async removeAdapter(groupId: string, userId: string): Promise<void> {
    await this.prisma.groupAdapter.delete({
      where: { groupId_userId: { groupId, userId } },
    });
  }
}
