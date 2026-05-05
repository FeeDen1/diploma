import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ValidationFailedException } from './common/exceptions/validation-failed.exception';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap() {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule);

  app.enableCors();
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

  const config = new DocumentBuilder()
    .setTitle('PM-Task API')
    .setDescription('Документация для API PM-Task')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(PORT, () =>
    console.log(`Server is running on port ${PORT}`),
  );
}
bootstrap().catch((err) => {
  console.error('Не удалось запустить приложение', err);
  process.exit(1);
});
