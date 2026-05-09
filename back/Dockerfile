# syntax=docker/dockerfile:1.7
#
# Multi-stage сборка бэка PM-Task.
#
#   1) deps    — устанавливает все зависимости (prod + dev) через npm ci
#   2) builder — генерит Prisma Client и компилирует Nest в dist/
#   3) runtime — слим-образ только с прод-зависимостями и собранным кодом
#
# База — Debian-bookworm-slim (а не alpine), чтобы Prisma миграционный
# движок завёлся без танцев с musl/glibc.

# ------------------------------------------------------------------
# 1) deps
# ------------------------------------------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# Сначала только манифесты — кеш слоя инвалидируется только при изменении
# package.json / package-lock.json, а не каждой правки исходника.
#
# --legacy-peer-deps: транзитивные peer-deps (типа keyv@4 от eslint-цепочки)
# конфликтуют с runtime-зависимостями нашего @keyv/redis@5. Они на runtime
# не пересекаются — eslint живёт только в dev. Флаг отключает строгую
# проверку peer-deps, как было в npm 6.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --legacy-peer-deps

# ------------------------------------------------------------------
# 2) builder
# ------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерим Prisma Client → ./generated/prisma/client (см. schema.prisma)
RUN npx prisma generate

# Компиляция TS → dist/
RUN npm run build

# Удаляем dev-зависимости в этом же слое, чтобы не таскать их дальше.
RUN npm prune --omit=dev

# ------------------------------------------------------------------
# 3) runtime
# ------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

# Утилиты для healthcheck/init + openssl для TLS-коннектов из Prisma.
# Без openssl Prisma шлёт warning «failed to detect libssl/openssl».
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl tini openssl \
    && rm -rf /var/lib/apt/lists/*

# Запускаемся НЕ от root: ограничиваем поверхность атаки и удовлетворяем
# best practice'ы Docker. Для node:22-bookworm-slim уже есть юзер `node`
# (UID/GID 1000) — переиспользуем его.
ENV NODE_ENV=production

COPY --from=builder --chown=node:node /app/node_modules     ./node_modules
COPY --from=builder --chown=node:node /app/dist             ./dist
COPY --from=builder --chown=node:node /app/generated        ./generated
COPY --from=builder --chown=node:node /app/prisma           ./prisma
# prisma.config.ts (TS-конфиг) и tsconfig.json — нужны Prisma CLI 7
# для запуска `prisma migrate deploy` в рантайме (CLI сама компилирует .ts).
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/tsconfig.json    ./tsconfig.json
COPY --from=builder --chown=node:node /app/package.json     ./package.json

USER node

EXPOSE 5001

# tini — крошечный init, корректно проксирует сигналы (SIGTERM от Docker
# доходит до Node), без него graceful shutdown не сработает.
ENTRYPOINT ["/usr/bin/tini", "--"]

# Прогон миграций при старте + запуск сервиса.
# В проде миграции должны быть идемпотентны (`migrate deploy` ровно так
# и делает: применяет только новые миграции).
#
# Путь dist/src/main.js — следствие того, что TS auto-вычисляет rootDir
# по корню всех .ts (включая prisma/seed.ts и generated/), и строит
# вложенную структуру dist/src/, dist/prisma/, dist/generated/.
# Менять это через rootDir конфликтует с импортами из generated/.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]

# Caddy/Docker hе будут считать контейнер живым, если /api/health не
# отвечает 30 секунд подряд. start-period даёт время на миграции.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl --fail --silent http://localhost:5001/api/health > /dev/null || exit 1
