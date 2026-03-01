import {
  formatDeadline,
  getDeadlineSeverity,
  isRecentlyCreated,
} from './date';

const NOW = new Date('2026-05-15T12:00:00Z');

describe('formatDeadline', () => {
  it('возвращает «Просрочено» для прошедшей даты', () => {
    expect(formatDeadline(new Date('2026-05-14T12:00:00Z'), NOW)).toBe(
      'Просрочено',
    );
  });

  it('минуты — когда осталось менее часа', () => {
    const in30m = new Date(NOW.getTime() + 30 * 60_000);
    expect(formatDeadline(in30m, NOW)).toBe('Осталось 30 мин');
  });

  it('часы — когда меньше суток', () => {
    const in5h = new Date(NOW.getTime() + 5 * 60 * 60_000);
    expect(formatDeadline(in5h, NOW)).toBe('Осталось 5 часов');
  });

  it('правильно склоняет 1 час', () => {
    const in1h = new Date(NOW.getTime() + 60 * 60_000 + 1000);
    expect(formatDeadline(in1h, NOW)).toBe('Осталось 2 часа');
  });

  it('дни — когда от 1 до 7', () => {
    const in3d = new Date(NOW.getTime() + 3 * 24 * 60 * 60_000);
    expect(formatDeadline(in3d, NOW)).toBe('Осталось 3 дня');
  });

  it('дата — когда больше 7 дней', () => {
    const longAfter = new Date('2026-06-01T12:00:00Z');
    expect(formatDeadline(longAfter, NOW)).toMatch(/^До \d+ июня$/);
  });
});

describe('getDeadlineSeverity', () => {
  it('expired — для прошедшей даты', () => {
    expect(
      getDeadlineSeverity(new Date('2026-05-14T12:00:00Z'), NOW),
    ).toBe('expired');
  });

  it('soon — менее суток до дедлайна', () => {
    const in12h = new Date(NOW.getTime() + 12 * 60 * 60_000);
    expect(getDeadlineSeverity(in12h, NOW)).toBe('soon');
  });

  it('normal — больше суток до дедлайна', () => {
    const in3d = new Date(NOW.getTime() + 3 * 24 * 60 * 60_000);
    expect(getDeadlineSeverity(in3d, NOW)).toBe('normal');
  });
});

describe('isRecentlyCreated', () => {
  it('true — создано менее 24 часов назад', () => {
    const created = new Date(NOW.getTime() - 5 * 60 * 60_000);
    expect(isRecentlyCreated(created, NOW)).toBe(true);
  });

  it('false — создано более 24 часов назад', () => {
    const created = new Date(NOW.getTime() - 25 * 60 * 60_000);
    expect(isRecentlyCreated(created, NOW)).toBe(false);
  });

  it('false — ровно 24 часа (граница)', () => {
    const created = new Date(NOW.getTime() - 24 * 60 * 60_000);
    expect(isRecentlyCreated(created, NOW)).toBe(false);
  });
});
