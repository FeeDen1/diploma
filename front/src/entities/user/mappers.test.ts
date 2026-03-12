import { toUserDomain } from './mappers';
import type { ReadUserDto } from '../../shared/api/users';

const baseDto: ReadUserDto = {
  id: 'u1',
  email: 'st1@student.spbu.ru',
  role: 'student',
  status: 'active',
  firstName: 'Иван',
  lastName: 'Иванов',
  ratingTotal: 100,
  spentPoints: 30,
  avatarUrl: null,
  createdAt: '2026-05-01T10:00:00Z',
};

describe('toUserDomain', () => {
  it('считает availablePoints как ratingTotal - spentPoints', () => {
    const user = toUserDomain(baseDto);
    expect(user.availablePoints).toBe(70);
  });

  it('availablePoints не уходит ниже нуля при отрицательном балансе', () => {
    const user = toUserDomain({ ...baseDto, ratingTotal: 50, spentPoints: 80 });
    expect(user.availablePoints).toBe(0);
  });

  it('склеивает fullName', () => {
    expect(toUserDomain(baseDto).fullName).toBe('Иван Иванов');
  });

  it('обрабатывает отсутствие spentPoints (старый бэк)', () => {
    const dto = { ...baseDto } as ReadUserDto & { spentPoints?: number };
    delete (dto as Partial<typeof dto>).spentPoints;
    const user = toUserDomain(dto as ReadUserDto);
    expect(user.spentPoints).toBe(0);
    expect(user.availablePoints).toBe(100);
  });

  it('конвертит createdAt в Date', () => {
    expect(toUserDomain(baseDto).createdAt).toBeInstanceOf(Date);
  });
});
