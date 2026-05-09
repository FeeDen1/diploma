import * as Joi from 'joi';

/**
 * Централизованная схема валидации env-переменных.
 *
 * Подключается в `ConfigModule.forRoot({ validationSchema })` и срабатывает
 * на старте приложения. Если хоть одна обязательная переменная отсутствует
 * или невалидна — приложение не поднимется и выведет в stderr полный список
 * проблем (благодаря `abortEarly: false` в опциях).
 *
 * Логика:
 *  - `required()` — без переменной приложение не запустится
 *  - `optional()` + `default()` — fallback, безопасный для прода
 *  - `optional()` без default — может отсутствовать (фича отключена)
 */
export const envValidationSchema = Joi.object({
  // ── Среда выполнения ──────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Хост/порт HTTP-сервера
  HOST: Joi.string().default('0.0.0.0'),
  PORT: Joi.number().integer().min(1).max(65535).default(5001),

  // Уровень логирования (Pino)
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),

  // ── База данных ───────────────────────────────────────────────
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  // ── JWT ───────────────────────────────────────────────────────
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().required(), // "15m", "1h"
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(), // "7d", "30d"
  JWT_REFRESH_EXPIRES_DAYS: Joi.number().integer().positive().required(),

  // ── CORS ──────────────────────────────────────────────────────
  // Список доменов через запятую, например:
  //   CORS_ORIGINS=https://api.pm-task.ru,https://pm-task.ru
  // Пусто или отсутствует — CORS открыт для всех (нужно для dev).
  CORS_ORIGINS: Joi.string().allow('').optional(),

  // ── SMTP / Mail ──────────────────────────────────────────────
  // Если MAIL_HOST не задан — MailService переходит в режим логов
  // (письма пишутся в stdout, не отправляются).
  MAIL_HOST: Joi.string().hostname().optional(),
  MAIL_PORT: Joi.number().integer().min(1).max(65535).default(587),
  MAIL_SECURE: Joi.string().valid('true', 'false').default('false'),
  MAIL_USER: Joi.string().allow('').optional(),
  MAIL_PASS: Joi.string().allow('').optional(),
  MAIL_FROM: Joi.string().email().default('no-reply@pm-task.local'),

  // ── S3 (Yandex Cloud Object Storage) ──────────────────────────
  S3_ENDPOINT: Joi.string().uri().required(),
  S3_BUCKET: Joi.string().required(),
  S3_REGION: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),

  // ── Expo Push ────────────────────────────────────────────────
  EXPO_PUSH_URL: Joi.string()
    .uri()
    .default('https://exp.host/--/api/v2/push/send'),
  // Не обязателен, но без него Expo может рейт-лимитить чаще.
  EXPO_ACCESS_TOKEN: Joi.string().allow('').optional(),

  // ── Redis (кеш) ──────────────────────────────────────────────
  // Если REDIS_URL не задан — CacheModule переходит на in-memory cache
  // внутри процесса. Для прод-сборки (docker compose) задаётся как
  // redis://redis:6379. Для локалки можно не задавать — cache всё равно
  // работает, просто без распределённости.
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .optional(),
});
