# CI/CD пайплайн

## Структура

```
.github/workflows/
├── back.yml      ← Lint + typecheck + jest для бэка
├── front.yml     ← Lint + typecheck + jest для фронта
└── deploy.yml    ← Auto-deploy на прод после успешного Back CI
```

## Логика срабатывания

| Что меняется | Back CI | Front CI | Deploy |
|---|---|---|---|
| `back/**` | ✓ | — | ✓ (после Back CI) |
| `front/**` | — | ✓ | — |
| `docker-compose.production.yml` | ✓ | — | ✓ |
| `Caddyfile` | ✓ | — | ✓ |
| `scripts/deploy.sh` | ✓ | — | ✓ |
| Только README или другие docs | — | — | — |

Фронт **не деплоится автоматически** — мобильное приложение распространяется
через EAS (`eas update --branch preview`). Это сделано вручную, чтобы не
отправлять «сырые» обновления пользователям при каждом push.

## Настройка GitHub Secrets

В `Settings → Secrets and variables → Actions → New repository secret`:

| Имя | Значение |
|---|---|
| `DEPLOY_HOST` | `45.157.163.3` |
| `DEPLOY_USER` | `pmtask` |
| `DEPLOY_SSH_KEY` | Приватный SSH-ключ deploy-аккаунта (см. ниже) |

### Создание deploy-ключа

Использовать **отдельный** ключ, а не свой основной — у CI нет passphrase, и
ключ хранится в GitHub. Минимизируем blast radius:

```bash
# На локальном маке
ssh-keygen -t ed25519 \
  -C "github-actions-pmtask-deploy" \
  -f ~/.ssh/pmtask_deploy_ci \
  -N ""

# Положить публичную часть на VPS
ssh-copy-id -i ~/.ssh/pmtask_deploy_ci.pub pmtask@45.157.163.3

# Приватную часть — в GitHub Secrets как DEPLOY_SSH_KEY
pbcopy < ~/.ssh/pmtask_deploy_ci          # macOS, копирует в буфер обмена
```

В `Settings → Secrets and variables → Actions` создать секрет
`DEPLOY_SSH_KEY` и вставить из буфера. Сохранить.

После этого можно приватный ключ удалить локально, если он больше не нужен:
```bash
rm ~/.ssh/pmtask_deploy_ci ~/.ssh/pmtask_deploy_ci.pub
```

## GitHub Environment

Workflow деплоя ссылается на environment `production`. Создать его в
`Settings → Environments → New environment → production`. Это даёт:

- audit log деплоев в `Settings → Environments → production → History`
- (опционально) required reviewers — кто-то должен апрувнуть деплой кнопкой
- (опционально) deployment branch protection — деплоить только с `main`

## Чем CI/CD отличается от `scripts/deploy.sh`

`deploy.sh` запускается с локалки и делает три вещи:

1. SCP `.env.production` на сервер (синхронизация секретов)
2. Push кода + git reset на сервере
3. `docker compose up --build -d`

GitHub Actions делает только (2) и (3). **Секреты в `.env.production` остаются
ручной операцией** — это намеренно:

- Безопаснее: env-файл с реальными паролями не попадает в логи Actions.
- Проще: не надо хранить дублёр env-файла в GitHub Secrets.
- На проде секреты меняются редко (раз в несколько месяцев).

Когда нужно обновить только код → push в `main`, CI/CD сам справится.
Когда нужно обновить секрет → правишь локально `.env.production`,
запускаешь `bash scripts/deploy.sh` (он зальёт .env и потом пересоберёт стек).

## Ручной запуск деплоя

Из вкладки `Actions → Deploy to production → Run workflow`. Полезно если:
- последний CI давно прошёл, а на сервере что-то нужно перекатить
- секреты обновили вручную и нужно подхватить

## Что проверяет deploy job

1. `git fetch origin main && git reset --hard` — синхронизация репо
2. `docker compose up --build -d` — пересборка backend образа, остальные
   контейнеры (postgres/redis/caddy) идут как есть
3. Healthcheck в цикле до 90 секунд: ждём пока контейнер `diploma-backend-1`
   станет `healthy`. Если нет — выводим последние 50 строк логов и падаем.
4. Smoke-test `curl http://localhost:5001/api/health` — финальная проверка
   что endpoint живой.

## Возможные причины падения деплоя

| Симптом | Причина | Решение |
|---|---|---|
| `Permission denied (publickey)` | DEPLOY_SSH_KEY не валидный или не на сервере | Проверить `ssh -i <key> pmtask@45.157.163.3` локально |
| `backend не стал healthy за 90 сек` | Прод-конфиг сломан или миграция упала | Подключиться по SSH, посмотреть `docker compose logs backend` |
| `health endpoint не ответил` | Бэк стартанул, но `/api/health` 5xx | Логи бэка → разобраться (обычно неверная env-переменная) |
| Сборка зависает на `npm ci` | Реестр недоступен или pkg-lock рассинхрон | На сервере `rm -rf back/node_modules && deploy.sh` с локалки |
