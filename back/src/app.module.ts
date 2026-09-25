import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { envValidationSchema } from './config/env.validation';
import { buildLoggerConfig } from './config/logger.config';
import { buildCacheModule } from './config/cache.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { TasksModule } from './tasks/tasks.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { PrismaModule } from './prisma';
import { S3Module } from './s3/s3.module';
import { FilesModule } from './files/files.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RewardsModule } from './rewards/rewards.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        // Показываем все ошибки разом, чтобы не чинить env по одной
        abortEarly: false,
        // Применяем default()-значения и приведение типов из схемы
        // обратно в process.env (чтобы старый код, читающий через
        // process.env.PORT напрямую, тоже видел дефолты).
        allowUnknown: true,
      },
    }),
    // Pino-логгер становится глобальным LoggerService — все Logger() и
    // dependency-injected ILogger пишут через него. HTTP-запросы логируются
    // автоматически (см. logger.config.ts).
    LoggerModule.forRoot(buildLoggerConfig(process.env)),
    // Глобальный кеш — Redis в проде, in-memory локально.
    // Используется через @UseInterceptors(CacheInterceptor) на горячих
    // GET-эндпоинтах (см. LeaderboardController).
    buildCacheModule(),
    ScheduleModule.forRoot(),
    // Глобальный rate-limiter. Применяется ко всем маршрутам через
    // APP_GUARD ниже. Конкретные роуты могут переопределить лимит
    // декоратором @Throttle({ ... }) или отключить через @SkipThrottle().
    //
    //   short:   20 запросов / 1 секунду  — дребезг кнопок
    //   medium: 150 запросов / минуту     — обычная активность пользователя
    //   long:  3000 запросов / час        — общий ceiling на IP
    //
    // Лимиты считаются ПО РЕАЛЬНОМУ IP (в main.ts включён trust proxy). Даны с
    // запасом: приложение на фокусе разом дёргает несколько ручек (задания,
    // рейтинг, профиль, группы), плюс pull-to-refresh — тесные лимиты давали 429.
    //
    // OTP-эндпоинты (verify, resend) дополнительно ограничены своими
    // throttle-декораторами на уровне auth-контроллера.
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1_000, limit: 20 },
      { name: 'medium', ttl: 60_000, limit: 150 },
      { name: 'long', ttl: 3_600_000, limit: 3_000 },
    ]),
    PrismaModule,
    S3Module,
    UsersModule,
    AuthModule,
    GroupsModule,
    TasksModule,
    SubmissionsModule,
    FilesModule,
    LeaderboardModule,
    NotificationsModule,
    RewardsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
