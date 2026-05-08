import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

interface HealthResponse {
  readonly status: 'ok' | 'degraded';
  readonly uptimeSeconds: number;
  readonly timestamp: string;
  readonly checks: {
    readonly database: 'ok' | 'fail';
  };
}

/**
 * Публичный health-check для Caddy/Docker/CI.
 *
 * Возвращает 200 даже при «degraded»-состоянии (БД недоступна) — это
 * сознательно: 200 говорит «процесс жив, отдавать запросы умеет», а
 * детали выводятся в JSON-теле. Балансировщик может смотреть либо на
 * статус-код, либо на поле `status`, в зависимости от настройки.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Проверка живости сервиса и подключения к БД' })
  @ApiResponse({
    status: 200,
    description: 'Сервис жив (статус в теле ответа)',
  })
  @Get()
  async check(): Promise<HealthResponse> {
    const databaseOk = await this.checkDatabase();
    return {
      status: databaseOk ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseOk ? 'ok' : 'fail',
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
}
