import { Injectable } from '@nestjs/common';
import { GroupsRepository, GroupWithRelations } from './groups.repository';
import { UsersService } from '../users/users.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { EntityAlreadyExistsException } from '../common/exceptions/conflict.exception';
import { DomainValidationException } from '../common/exceptions/validation.exception';
import { Direction, Group } from '../../generated/prisma/client';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly usersService: UsersService,
  ) {}

  async createGroup(dto: CreateGroupDto): Promise<Group> {
    return this.groupsRepository.create({
      name: dto.name,
      year: dto.year,
      direction: dto.direction,
    });
  }

  async getAllGroups(
    filters: { direction?: Direction } = {},
  ): Promise<Group[]> {
    return this.groupsRepository.findAll(filters);
  }

  async getGroupById(id: string): Promise<GroupWithRelations> {
    const group = await this.groupsRepository.findById(id);
    if (!group) {
      throw new EntityNotFoundException('Group', id);
    }
    return group;
  }

  async updateGroup(id: string, dto: UpdateGroupDto): Promise<Group> {
    await this.getGroupById(id);
    return this.groupsRepository.update(id, dto);
  }

  async deleteGroup(id: string): Promise<void> {
    await this.getGroupById(id);
    await this.groupsRepository.delete(id);
  }

  async addMember(groupId: string, userId: string): Promise<void> {
    await this.getGroupById(groupId);
    await this.usersService.getUserById(userId);

    const existing = await this.groupsRepository.findMember(groupId, userId);
    if (existing) {
      throw new EntityAlreadyExistsException('GroupMember', 'userId', userId);
    }

    await this.groupsRepository.addMember(groupId, userId);
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    await this.getGroupById(groupId);

    const existing = await this.groupsRepository.findMember(groupId, userId);
    if (!existing) {
      throw new EntityNotFoundException('GroupMember', userId);
    }

    await this.groupsRepository.removeMember(groupId, userId);
  }

  async addAdapter(groupId: string, userId: string): Promise<void> {
    await this.getGroupById(groupId);
    const user = await this.usersService.getUserById(userId);

    // Куратором группы может быть и adapter, и admin (последний вправе
    // курировать собственноручно). Студентов сначала надо повысить до adapter.
    if (user.role !== 'adapter' && user.role !== 'admin') {
      throw new DomainValidationException(
        'В кураторы можно назначить только пользователя с ролью adapter или admin',
      );
    }

    const existing = await this.groupsRepository.findAdapter(groupId, userId);
    if (existing) {
      throw new EntityAlreadyExistsException('GroupAdapter', 'userId', userId);
    }

    await this.groupsRepository.addAdapter(groupId, userId);
  }

  async removeAdapter(groupId: string, userId: string): Promise<void> {
    await this.getGroupById(groupId);

    const existing = await this.groupsRepository.findAdapter(groupId, userId);
    if (!existing) {
      throw new EntityNotFoundException('GroupAdapter', userId);
    }

    await this.groupsRepository.removeAdapter(groupId, userId);
  }

  /**
   * Студенты группы с агрегатами по статусам сдач.
   * Доступ: admin — везде; adapter — только если он куратор именно этой группы.
   */
  async getStudentsProgress(
    groupId: string,
    requester: { id: string; role: string },
  ): Promise<
    {
      user: import('../../generated/prisma/client').User;
      submissions: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
      };
    }[]
  > {
    const group = await this.getGroupById(groupId);

    if (requester.role !== 'admin') {
      const isCurator = group.adapters.some(
        (adapter) => adapter.userId === requester.id,
      );
      if (!isCurator) {
        throw new DomainValidationException('У вас нет доступа к этой группе');
      }
    }

    const breakdown =
      await this.groupsRepository.findStudentsSubmissionsBreakdown(groupId);

    const byStudent = new Map<
      string,
      { pending: number; approved: number; rejected: number; total: number }
    >();

    for (const row of breakdown) {
      const counts = byStudent.get(row.studentId) ?? {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
      };
      if (row.status === 'pending') counts.pending = row.count;
      else if (row.status === 'approved') counts.approved = row.count;
      else if (row.status === 'rejected') counts.rejected = row.count;
      counts.total += row.count;
      byStudent.set(row.studentId, counts);
    }

    return group.members.map((member) => ({
      user: member.user,
      submissions: byStudent.get(member.userId) ?? {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
      },
    }));
  }
}
