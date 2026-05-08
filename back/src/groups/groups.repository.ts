import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  Group,
  GroupMember,
  GroupAdapter,
  User,
  Prisma,
} from '../../generated/prisma/client';

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

  async findAll(
    filters: {
      direction?: Prisma.EnumDirectionFilter | Group['direction'];
    } = {},
  ): Promise<Group[]> {
    return this.prisma.group.findMany({
      where: filters.direction ? { direction: filters.direction } : undefined,
      orderBy: [{ year: 'desc' }, { name: 'asc' }],
    });
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

  async findMember(
    groupId: string,
    userId: string,
  ): Promise<GroupMember | null> {
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

  async findAdapter(
    groupId: string,
    userId: string,
  ): Promise<GroupAdapter | null> {
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

  /**
   * Один SQL-запрос с group by — для каждой пары (student, status)
   * количество сдач у студентов группы. Используется для прогресса в адаптерке.
   */
  async findStudentsSubmissionsBreakdown(
    groupId: string,
  ): Promise<{ studentId: string; status: string; count: number }[]> {
    const rows = await this.prisma.$queryRaw<
      { student_id: string; status: string; count: bigint }[]
    >`
      SELECT s.student_id, s.status, COUNT(*)::bigint AS count
      FROM task_submissions s
      JOIN group_members gm ON gm.user_id = s.student_id
      WHERE gm.group_id = ${groupId}::uuid
      GROUP BY s.student_id, s.status
    `;
    return rows.map((row) => ({
      studentId: row.student_id,
      status: row.status,
      count: Number(row.count),
    }));
  }
}
