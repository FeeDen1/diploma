/**
 * Утилиты для отображения сроков выполнения заданий.
 *
 * Бэкенд хранит ISO-строку, фронт работает с Date. На карточках и шите
 * нужна короткая человеко-читаемая подпись + цветовой класс «горит / норма /
 * просрочено», поэтому делим логику на форматирование и severity.
 */

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Меньше суток до дедлайна — показываем «горящий» цвет. */
const SOON_THRESHOLD_MS = MS_PER_DAY;

/** Сущность считается «новой» в течение этого окна с момента создания. */
const NEW_THRESHOLD_MS = MS_PER_DAY;

/**
 * Создано менее 24 часов назад — используется для маркера «Новое»
 * на карточках заданий и подобных списках.
 */
export function isRecentlyCreated(
  createdAt: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() - createdAt.getTime() < NEW_THRESHOLD_MS;
}

export type DeadlineSeverity = 'expired' | 'soon' | 'normal';

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/**
 * Возвращает severity, чтобы UI мог раскрасить элемент без повторной арифметики.
 */
export function getDeadlineSeverity(
  deadline: Date,
  now: Date = new Date(),
): DeadlineSeverity {
  const diff = deadline.getTime() - now.getTime();
  if (diff <= 0) return 'expired';
  if (diff <= SOON_THRESHOLD_MS) return 'soon';
  return 'normal';
}

/**
 * Короткая подпись срока для бейджа/строки.
 *
 * Логика: в пределах суток — «осталось X ч» / «осталось X мин»; до 7 дней —
 * «осталось N дн.»; дальше — конкретная дата «до 1 июня». «Просрочено» — для
 * прошедших дат (студентам не показываем такие задания, но админу/куратору они
 * возвращаются и должны быть промаркированы).
 */
export function formatDeadline(
  deadline: Date,
  now: Date = new Date(),
): string {
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) return 'Просрочено';

  if (diff < MS_PER_HOUR) {
    const minutes = Math.max(1, Math.ceil(diff / MS_PER_MINUTE));
    return `Осталось ${minutes} ${pluralizeMinutes(minutes)}`;
  }

  if (diff < MS_PER_DAY) {
    const hours = Math.ceil(diff / MS_PER_HOUR);
    return `Осталось ${hours} ${pluralizeHours(hours)}`;
  }

  const days = Math.ceil(diff / MS_PER_DAY);
  if (days <= 7) {
    return `Осталось ${days} ${pluralizeDays(days)}`;
  }

  return `До ${deadline.getDate()} ${MONTHS_GENITIVE[deadline.getMonth()]}`;
}

function pluralizeMinutes(count: number): string {
  return pluralizeRu(count, ['мин', 'мин', 'мин']);
}

function pluralizeHours(count: number): string {
  return pluralizeRu(count, ['час', 'часа', 'часов']);
}

function pluralizeDays(count: number): string {
  return pluralizeRu(count, ['день', 'дня', 'дней']);
}

function pluralizeRu(
  count: number,
  forms: readonly [string, string, string],
): string {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}
