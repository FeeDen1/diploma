import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { TaskCategory } from '@shared/api/tasks';
import type { DeadlineSeverity } from '@shared/lib/date';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface CategoryTheme {
  /** Акцентный цвет категории — чип, иконка, бейдж награды, рамка, кнопка. */
  color: string;
  /** Имя Ionicon (outline) для чипа/заглушки обложки. */
  icon: IoniconName;
}

/**
 * Айдентика категорий задания: цвет + иконка. Одним цветом красится вся
 * карточка сдачи (шапка, награда, слот доказательства, кнопка), чтобы задания
 * разных типов визуально различались. Цвета — насыщенные средние тона, читаемые
 * и на тёмной обложке, и на светлой поверхности шита.
 */
export const TASK_CATEGORY_THEME: Record<TaskCategory, CategoryTheme> = {
  study: { color: '#378ADD', icon: 'school-outline' },
  sport: { color: '#12A66E', icon: 'basketball-outline' },
  outdoor: { color: '#E0863A', icon: 'leaf-outline' },
  teambuilding: { color: '#D4537E', icon: 'people-outline' },
  activism: { color: '#7C6FE0', icon: 'megaphone-outline' },
  other: { color: '#64748B', icon: 'apps-outline' },
};

/**
 * Цвет дедлайна поверх тёмной обложки (в шапке). Светлые оттенки, чтобы
 * читалось на фото: срочный — тёплый, просроченный — красный, обычный — светлый.
 */
export const ON_IMAGE_DEADLINE_COLOR: Record<DeadlineSeverity, string> = {
  expired: '#FCA5A5',
  soon: '#FCD9A6',
  normal: '#E6EDF2',
};

/** Hex-цвет с альфой: `#RRGGBB` + доля 0..1 → `#RRGGBBAA`. */
export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.min(Math.max(alpha, 0), 1);
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
