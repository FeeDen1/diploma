import type { Params } from 'nestjs-pino';
import type { IncomingMessage } from 'http';

/**
 * Конфиг Pino-логгера. В dev — pretty-print (читаемый цветной вывод),
 * в проде — однострочный JSON, который удобно грепать и складывать в
 * любой агрегатор логов (ELK, Loki, CloudWatch).
 *
 * Чувствительные поля автоматически маскируются: токены в Authorization,
 * cookies, пароли и т.п. — заменяются на `[Redacted]` ещё до записи.
 */
export function buildLoggerConfig(env: NodeJS.ProcessEnv): Params {
  const isProduction = env.NODE_ENV === 'production';
  const level = env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug');

  return {
    pinoHttp: {
      level,
      // Уровень для логов приходящих запросов: info по умолчанию,
      // 4xx — warn, 5xx и брошенные ошибки — error.
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      // Не логируем health-check, чтобы не засорять stdout каждые 30 секунд
      // (Caddy/Docker дёргают его постоянно).
      autoLogging: {
        ignore: (req: IncomingMessage) =>
          req.url?.startsWith('/api/health') ?? false,
      },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]',
          'req.body.password',
          'req.body.confirmPassword',
          'req.body.code',
          'req.body.refreshToken',
          'res.headers["set-cookie"]',
        ],
        censor: '[Redacted]',
      },
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:HH:MM:ss.l',
              ignore: 'pid,hostname,req,res,responseTime',
              messageFormat: '{context} {msg}',
              singleLine: true,
            },
          },
    },
  };
}
