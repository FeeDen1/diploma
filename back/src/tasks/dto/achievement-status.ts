/**
 * Статус задания с точки зрения конкретного студента.
 *
 *  - available — студент ещё не сдавал задание (доступно к выполнению)
 *  - pending   — сдача отправлена, ждёт проверки куратора
 *  - approved  — сдача засчитана
 *  - rejected  — сдача отклонена, нужно переделать
 *
 * Это вычисляемое значение: в БД его нет, оно получается LEFT JOIN'ом
 * задания на сабмишены текущего пользователя.
 */
export type AchievementStatus =
  | 'available'
  | 'pending'
  | 'approved'
  | 'rejected';

export const ACHIEVEMENT_STATUSES: AchievementStatus[] = [
  'available',
  'pending',
  'approved',
  'rejected',
];

export function isAchievementStatus(value: string): value is AchievementStatus {
  return (ACHIEVEMENT_STATUSES as string[]).includes(value);
}
