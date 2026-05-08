import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger, LoggerErrorInterceptor } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationFailedException } from './common/exceptions/validation-failed.exception';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap(): Promise<void> {
  // bufferLogs: true — копим логи бутстрапа, чтобы выдать их через Pino
  // после того, как он зарегистрируется (иначе бы они шли через дефолтный
  // консольный логгер).
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  const config = app.get(ConfigService);
  const logger = app.get(PinoLogger);

  // Все процессовые сигналы (SIGINT, SIGTERM) попадают в onModuleDestroy
  // у провайдеров. PrismaService закроет коннекты, текущие HTTP-запросы
  // дойдут до конца. Без этого `docker stop` рвёт активные SQL-запросы.
  app.enableShutdownHooks();

  // Базовые security-заголовки: HSTS, X-Frame-Options, Content-Security-Policy
  // и т.п. Для API + Swagger CSP не нужен (мы не отдаём HTML, кроме /api/docs,
  // и helmet по умолчанию его поломает) — отключаем только этот пункт.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS: если CORS_ORIGINS пуст или не задан — открыт (для dev).
  // В проде передаём список доменов через запятую.
  const corsOriginsRaw = config.get<string>('CORS_ORIGINS') ?? '';
  const corsOrigins = corsOriginsRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new DomainExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const formattedErrors: Record<string, string[]> = {};
        errors.forEach((error) => {
          const field = error.property;
          const messages = error.constraints
            ? Object.values(error.constraints)
            : ['Некорректное значение'];
          formattedErrors[field] = messages;
        });
        return new ValidationFailedException(formattedErrors);
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PM-Task API')
    .setDescription('Документация для API PM-Task')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.getOrThrow<number>('PORT');
  const host = config.getOrThrow<string>('HOST');
  await app.listen(port, host);
  logger.log(`Server is running on http://${host}:${port}`, 'Bootstrap');
  logger.log(`Swagger UI: http://${host}:${port}/api/docs`, 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  console.error('Не удалось запустить приложение', err);
  process.exit(1);
});
