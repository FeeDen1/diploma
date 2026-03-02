export const API_CONFIG = {
  BASE_URL: 'https://api.example.com/v1',
  TIMEOUT: 10000,
} as const;

export const DIRECTIONS = ['ПМИ', 'ПИИТ', 'БД', 'ПКТ'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const GROUPS_BY_DIRECTION: Record<Direction, string[]> = {
  'ПМИ': ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
  'ПИИТ': ['11', '12', '13'],
  'БД': ['15', '16', '17'],
  'ПКТ': ['14'],
};

export const ACHIEVEMENT_TYPES = ['Спорт', 'Учёба', 'Творчество', 'Волонтёрство', 'Другое'] as const;
export type AchievementType = (typeof ACHIEVEMENT_TYPES)[number];

export const USER_ROLES = ['student', 'admin', 'adapter'] as const;
export type UserRole = (typeof USER_ROLES)[number];

