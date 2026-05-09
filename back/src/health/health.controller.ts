import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

interface HealthResponse {
  readonly status: 'ok' | 'degraded';
  readonly uptimeSeconds: number;
  readonly timestamp: string;
  readonly checks: {
    readonly database: 'ok' | 'fail';
    readonly cache: 'ok' | 'fail' | 'memory';
  };
}

/**
 * Публичный health-check для Caddy/Docker/CI.
 *
 * Возвращает 200 даже при «degraded»-состоянии — это сознательно: 200
 * говорит «процесс жив, отдавать запросы умеет», а детали выводятся в
 * JSON-теле.
 *
 * Проверка cache:
 *   - "ok"     — настроен Redis, ping проходит
 *   - "fail"   — настроен Redis, но не отвечает (бэк работает на in-memory fallback)
 *   - "memory" — Redis не настроен, in-memory cache внутри процесса (это норма для dev)
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  @ApiOperation({ summary: 'Проверка живости сервиса и подключения к БД/кешу' })
  @ApiResponse({
    status: 200,
    description: 'Сервис жив (статус в теле ответа)',
  })
  @Get()
  async check(): Promise<HealthResponse> {
    const [databaseOk, cacheStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
    ]);
    return {
      status: databaseOk ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseOk ? 'ok' : 'fail',
        cache: cacheStatus,
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkCache(): Promise<'ok' | 'fail' | 'memory'> {
    const usingRedis = !!this.config.get<string>('REDIS_URL');
    try {
      await this.cache.set('__health__', '1', 1_000);
      const value = await this.cache.get<string>('__health__');
      if (value !== '1') return usingRedis ? 'fail' : 'memory';
      return usingRedis ? 'ok' : 'memory';
    } catch {
      return usingRedis ? 'fail' : 'memory';
    }
  }
}
