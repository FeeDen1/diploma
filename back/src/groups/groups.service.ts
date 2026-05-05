import { Injectable } from '@nestjs/common';
import { GroupsRepository, GroupWithRelations } from './groups.repository';
import { UsersService } from '../users/users.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { EntityAlreadyExistsException } from '../common/exceptions/conflict.exception';
import { DomainValidationException } from '../common/exceptions/validation.exception';
import { Group } from '../../generated/prisma/client';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly usersService: UsersService,
  ) {}

  async createGroup(dto: CreateGroupDto): Promise<Group> {
    return this.groupsRepository.create({ name: dto.name, year: dto.year });
  }

  async getAllGroups(): Promise<Group[]> {
    return this.groupsRepository.findAll();
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

    if (user.role !== 'adapter') {
      throw new DomainValidationException(
        'Пользователь должен иметь роль adapter',
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
}
