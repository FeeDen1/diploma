import type {
  ReadGroupDetailDto,
  ReadGroupDto,
} from '../../shared/api/groups';
import { toUserDomain } from '../user/mappers';
import type { Group, GroupDetail } from './types';

export function toGroupDomain(dto: ReadGroupDto): Group {
  return {
    id: dto.id,
    name: dto.name,
    year: dto.year,
    direction: dto.direction,
    createdAt: new Date(dto.createdAt),
  };
}

export function toGroupDetailDomain(dto: ReadGroupDetailDto): GroupDetail {
  return {
    ...toGroupDomain(dto),
    members: dto.members.map(toUserDomain),
    adapters: dto.adapters.map(toUserDomain),
  };
}
