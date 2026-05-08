import type { ReadTaskDto } from '../../shared/api/tasks';
import type { Task } from './types';

export function toTaskDomain(dto: ReadTaskDto): Task {
  const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
  const archivedAt = dto.archivedAt ? new Date(dto.archivedAt) : null;
  const now = new Date();

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    type: dto.type,
    category: dto.category,
    points: dto.points,
    coverUrl: dto.taskFileUrl,
    expiresAt,
    archivedAt,
    createdAt: new Date(dto.createdAt),
    isExpired: !!expiresAt && expiresAt < now,
    isArchived: !!archivedAt,
  };
}
