import { Injectable } from '@nestjs/common';
import { UsersRepository, UserWithAvatar } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { EntityAlreadyExistsException } from '../common/exceptions/conflict.exception';
import { EntityNotFoundException } from '../common/exceptions/not-found.exception';
import { hashPassword } from '../common/utils/password.utils';
import { UserRole } from '../../generated/prisma/client';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserWithAvatar> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new EntityAlreadyExistsException('User', 'email', dto.email);
    }

    const passwordHash = await hashPassword(dto.password);

    return this.usersRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }

  async getAllUsers(): Promise<UserWithAvatar[]> {
    return this.usersRepository.findAll();
  }

  async getUserById(id: string): Promise<UserWithAvatar> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException('User', id);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserWithAvatar | null> {
    return this.usersRepository.findByEmail(email);
  }

  async changeRole(id: string, role: UserRole): Promise<UserWithAvatar> {
    await this.getUserById(id);
    return this.usersRepository.update(id, { role });
  }

  async setAvatar(userId: string, fileId: string): Promise<UserWithAvatar> {
    await this.getUserById(userId);
    return this.usersRepository.update(userId, {
      avatarFile: { connect: { id: fileId } },
    });
  }

  getAvatarUrl(user: UserWithAvatar): string | null {
    if (!user.avatarFile) return null;
    return this.s3Service.getPublicUrl(user.avatarFile.objectKey);
  }
}
