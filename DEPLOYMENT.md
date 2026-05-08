# Deployment

Документ описывает, как развернуть бэкенд PM-Task через Docker Compose.

На этапе 2 (контейнеризация) описан **локальный smoke-test**. Этап 3
(VPS) и этап 4 (Caddy + домен + TLS) добавятся ниже по мере прохождения.

---

## Локальный smoke-test (этап 2)

**Цель:** убедиться, что Docker-сборка проходит, миграции прокатывают,
бэкенд поднимается, `/api/health` отвечает.

### 1. Скопировать env-шаблон

```bash
cp .env.production.example .env.production
```

Открыть `.env.production` и заполнить **минимально-достаточный набор**
для запуска:

- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` — придумать любые
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — сгенерить
  ```bash
  openssl rand -base64 48
  openssl rand -base64 48
  ```
- `JWT_ACCESS_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=30d`, `JWT_REFRESH_EXPIRES_DAYS=30`
- `S3_*` — взять из текущего `back/.env` (Yandex Cloud креды)
- `MAIL_*` — можно пропустить (приложение перейдёт в режим логов)

### 2. Поднять стек

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up --build -d
```

Первая сборка — ~3–5 минут (загрузка node:22-bookworm-slim,
`npm ci`, `prisma generate`, `nest build`). Дальнейшие — быстрее за счёт
кеша слоёв.

### 3. Проверить что поднялось

```bash
# Статус контейнеров (оба должны быть Up + healthy)
docker compose --env-file .env.production -f docker-compose.production.yml ps

# Логи бэка — должно быть «Server is running on http://0.0.0.0:5001»
docker compose --env-file .env.production -f docker-compose.production.yml logs backend

# Health-endpoint
curl http://localhost:5001/api/health
# Ожидаем:
# {"status":"ok","uptimeSeconds":N,"timestamp":"...","checks":{"database":"ok"}}

# Swagger
open http://localhost:5001/api/docs
```

### 4. Прогнать end-to-end

- Зарегистрировать тестового юзера через Swagger (`POST /api/auth/register`)
- В логах бэка должен появиться OTP-код (если `MAIL_*` пустые)
- Подтвердить OTP, получить токены
- Загрузить файл (любой) — должен уехать в Yandex S3 bucket

### 5. Остановить

```bash
docker compose --env-file .env.production -f docker-compose.production.yml down
```

Volume `postgres_data` сохраняется. Чтобы снести и БД:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml down -v
```

---

## Полезные команды

```bash
# Перезапустить только бэк (после правок кода)
docker compose --env-file .env.production -f docker-compose.production.yml up --build -d backend

# Подключиться к Postgres внутри контейнера
docker compose --env-file .env.production -f docker-compose.production.yml exec postgres \
  psql -U $POSTGRES_USER -d $POSTGRES_DB

# Применить новые миграции вручную (без рестарта)
docker compose --env-file .env.production -f docker-compose.production.yml exec backend \
  npx prisma migrate deploy

# Заглянуть в файлы внутри контейнера бэка
docker compose --env-file .env.production -f docker-compose.production.yml exec backend sh
```

---

## VPS-деплой (этап 3) — TBD

## Caddy + домен + TLS (этап 4) — TBD
