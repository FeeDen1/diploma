import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { S3Service } from '../s3/s3.service';
import { UserRole } from '../../generated/prisma/client';
import type { TokenPayload } from '../auth/interfaces/token-payload.interface';

describe('TasksService.listTasks', () => {
  let tasksRepository: jest.Mocked<TasksRepository>;
  let s3Service: jest.Mocked<S3Service>;
  let service: TasksService;

  const admin: TokenPayload = {
    id: 'a',
    email: 'admin@x',
    role: UserRole.admin,
  };
  const adapter: TokenPayload = {
    id: 'b',
    email: 'adapter@x',
    role: UserRole.adapter,
  };
  const student: TokenPayload = {
    id: 'c',
    email: 'st@x',
    role: UserRole.student,
  };

  beforeEach(() => {
    tasksRepository = {
      archiveExpired: jest.fn().mockResolvedValue({ count: 0 }),
      findAndCountForUser: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      unarchive: jest.fn(),
    } as unknown as jest.Mocked<TasksRepository>;
    s3Service = {
      getPublicUrl: jest.fn(),
    } as unknown as jest.Mocked<S3Service>;
    service = new TasksService(tasksRepository, s3Service);
  });

  it('всегда дёргает archiveExpired перед чтением', async () => {
    await service.listTasks(student, {});
    expect(tasksRepository.archiveExpired).toHaveBeenCalled();
  });

  it('admin с includeArchived=true получает архив', async () => {
    await service.listTasks(admin, { includeArchived: true });

    expect(tasksRepository.findAndCountForUser).toHaveBeenCalledWith(
      expect.objectContaining({ includeArchived: true }),
    );
  });

  it('admin без флага не получает архив', async () => {
    await service.listTasks(admin, {});

    expect(tasksRepository.findAndCountForUser).toHaveBeenCalledWith(
      expect.objectContaining({ includeArchived: false }),
    );
  });

  it('adapter не может видеть архив даже с includeArchived=true', async () => {
    await service.listTasks(adapter, { includeArchived: true });

    expect(tasksRepository.findAndCountForUser).toHaveBeenCalledWith(
      expect.objectContaining({ includeArchived: false }),
    );
  });

  it('student не может видеть архив даже с includeArchived=true', async () => {
    await service.listTasks(student, { includeArchived: true });

    expect(tasksRepository.findAndCountForUser).toHaveBeenCalledWith(
      expect.objectContaining({ includeArchived: false }),
    );
  });

  it('по умолчанию limit=20, offset=0, sort=deadline', async () => {
    await service.listTasks(student, {});

    expect(tasksRepository.findAndCountForUser).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 0, sort: 'deadline' }),
    );
  });
});
