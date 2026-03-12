import { toRewardDomain, toRewardOrderDomain } from './mappers';

describe('toRewardDomain', () => {
  it('конвертит createdAt в Date и переносит поля', () => {
    const result = toRewardDomain({
      id: 'r1',
      title: 'Худи',
      price: 80,
      imageUrl: 'https://x/img.png',
      archivedAt: null,
      createdAt: '2026-05-01T10:00:00Z',
    });
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.title).toBe('Худи');
    expect(result.price).toBe(80);
  });
});

describe('toRewardOrderDomain', () => {
  it('переносит snapshot-поля и статус', () => {
    const result = toRewardOrderDomain({
      id: 'red-1',
      itemTitle: 'Кружка',
      itemPrice: 50,
      status: 'pending',
      imageUrl: null,
      createdAt: '2026-05-10T08:00:00Z',
    });
    expect(result.itemTitle).toBe('Кружка');
    expect(result.itemPrice).toBe(50);
    expect(result.status).toBe('pending');
    expect(result.createdAt).toBeInstanceOf(Date);
  });
});
