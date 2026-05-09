import {
  CacheModule,
  type CacheModuleAsyncOptions,
} from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import type { DynamicModule } from '@nestjs/common';

/**
 * Конфиг глобального кеша.
 *
 * Если REDIS_URL задан — используется Redis (для прод-сборки в docker-compose).
 * Если нет — fallback на in-memory cache внутри процесса (полезно для dev,
 * unit-тестов и локального запуска без Docker).
 *
 * TTL по умолчанию 60 секунд — этого хватает чтобы залп запросов на
 * /api/leaderboard от 50 одновременных пользователей упёрся в кеш, а не в
 * Postgres. На редких операциях (создание задания) кеш просто игнорируется.
 *
 * Точечная инвалидация при изменении ratingTotal не делается осознанно:
 * 60-секундная свежесть для лидерборда ОК, а инвалидация по событию
 * добавляет связность между submissions и leaderboard модулями.
 */
const cacheModuleOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const redisUrl = configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      return {
        ttl: 60_000,
      };
    }

    return {
      stores: [createKeyv(redisUrl)],
      ttl: 60_000,
    };
  },
};

export function buildCacheModule(): DynamicModule {
  return CacheModule.registerAsync(cacheModuleOptions);
}
