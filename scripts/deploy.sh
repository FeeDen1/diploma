#!/usr/bin/env bash
#
# deploy.sh — деплой PM-Task на VPS.
#
# Запускается с ЛОКАЛЬНОГО мака. Делает:
#   1) Проверяет, что локальная ветка чистая и ничего не закомичено
#   2) Пушит текущий main в origin (чтобы на сервере был последний код)
#   3) Копирует .env.production на сервер через scp
#   4) На сервере: clone (первый раз) или fetch + reset --hard
#   5) На сервере: docker compose up --build -d
#   6) Ждёт healthcheck и проверяет /api/health через ssh
#
# Применение:
#   bash scripts/deploy.sh
#
# Параметры (можно через env-переменные):
#   DEPLOY_HOST   — публичный IP/хост сервера         (default: 45.157.163.3)
#   DEPLOY_USER   — SSH-юзер                          (default: pmtask)
#   DEPLOY_DIR    — путь на сервере                   (default: /opt/pmtask)
#   DEPLOY_REPO   — git-URL                           (default: https://github.com/FeeDen1/diploma.git)
#   DEPLOY_BRANCH — какую ветку деплоим               (default: main)

set -euo pipefail

# =============================================================
# Параметры
# =============================================================
HOST="${DEPLOY_HOST:-45.157.163.3}"
USER_NAME="${DEPLOY_USER:-pmtask}"
APP_DIR="${DEPLOY_DIR:-/opt/pmtask}"
REPO_URL="${DEPLOY_REPO:-https://github.com/FeeDen1/diploma.git}"
BRANCH="${DEPLOY_BRANCH:-main}"

LOCAL_REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_LOCAL="$LOCAL_REPO_ROOT/.env.production"
COMPOSE_FILE="docker-compose.production.yml"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "\n${BLUE}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $*${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $*${NC}"; }
fail() { echo -e "${RED}  ✗ $*${NC}" >&2; exit 1; }

ssh_remote() {
    ssh -o StrictHostKeyChecking=accept-new "$USER_NAME@$HOST" "$@"
}

# =============================================================
# 0. Предполётные проверки
# =============================================================
step "Предполётные проверки"

[[ -f "$ENV_LOCAL" ]] || fail ".env.production не найден: $ENV_LOCAL"
ok ".env.production найден"

# Проверяем, что у юзера есть git
command -v git >/dev/null || fail "git не установлен"

# Проверяем, что репо чистое (нет несохранённых правок)
cd "$LOCAL_REPO_ROOT"
if ! git diff --quiet || ! git diff --cached --quiet; then
    warn "В репозитории есть несохранённые правки!"
    git status -s
    read -r -p "Продолжить деплой без них? [y/N] " ans
    [[ "$ans" == "y" || "$ans" == "Y" ]] || fail "Отменено"
fi
ok "репозиторий чистый (или ты подтвердил)"

# Проверяем доступность сервера по ssh
ssh_remote "echo connected" >/dev/null || fail "SSH к $USER_NAME@$HOST не работает"
ok "SSH к серверу работает"

# =============================================================
# 1. Push в origin
# =============================================================
step "Пушим $BRANCH в origin (чтобы сервер взял последний код)"
git push origin "$BRANCH"
ok "запушено"

# =============================================================
# 2. Копирование .env.production на сервер
# =============================================================
step "Копирую .env.production → $HOST:$APP_DIR/.env.production"
scp -o StrictHostKeyChecking=accept-new \
    "$ENV_LOCAL" "$USER_NAME@$HOST:$APP_DIR/.env.production"
ok "скопировано"

# =============================================================
# 3. На сервере — clone/pull + compose up
# =============================================================
step "Деплой на сервере"

# Передаём heredoc'ом скрипт, чтобы выполнить его одним SSH-сеансом —
# меньше латентности и не разрывается контекст между командами.
ssh_remote bash -se <<REMOTE_SCRIPT
set -euo pipefail

APP_DIR='$APP_DIR'
REPO_URL='$REPO_URL'
BRANCH='$BRANCH'
COMPOSE_FILE='$COMPOSE_FILE'

cd "\$APP_DIR"

# 3a. Клон или fetch
if [[ ! -d ".git" ]]; then
    echo '▶ Первый деплой — клонируем репо'
    # Если в папке есть только .env.production, GitHub даст плюнуться:
    # «целевая папка не пуста». Поэтому клоним во временную и переносим.
    tmp=\$(mktemp -d)
    git clone --branch "\$BRANCH" --single-branch "\$REPO_URL" "\$tmp"
    # переносим всё (включая .git) кроме .env.production
    shopt -s dotglob
    mv "\$tmp"/* "\$tmp"/.* "\$APP_DIR/" 2>/dev/null || true
    rmdir "\$tmp" 2>/dev/null || true
    echo '  ✓ репо склонировано'
else
    echo '▶ Обновление кода'
    git fetch origin "\$BRANCH"
    git reset --hard "origin/\$BRANCH"
    echo "  ✓ HEAD = \$(git rev-parse --short HEAD)"
fi

# 3b. Подъём стека
echo '▶ docker compose up --build -d'
docker compose --env-file .env.production -f "\$COMPOSE_FILE" up --build -d
echo '  ✓ стек поднят'

# 3b.1 Перезагрузка Caddy
# Caddyfile примонтирован в caddy через volume, но сам Caddy не следит
# за файлом — поэтому при изменениях в Caddyfile (новые домены, security
# headers) compose не пересоздаёт контейнер (image не менялся), и старый
# конфиг продолжает действовать. Делаем reload руками — он без даунтайма.
echo '▶ Перечитываю Caddyfile (caddy reload)'
docker compose --env-file .env.production -f "\$COMPOSE_FILE" \\
    exec -T caddy caddy reload --config /etc/caddy/Caddyfile 2>&1 || {
    echo '  ⚠ caddy reload не прошёл, пробую restart'
    docker compose --env-file .env.production -f "\$COMPOSE_FILE" restart caddy
}
echo '  ✓ Caddy с новым конфигом'

# 3c. Ждём healthcheck'а
echo '▶ Ждём, пока бэк станет healthy (до 90 сек)'
for i in {1..18}; do
    status=\$(docker inspect --format='{{.State.Health.Status}}' diploma-backend-1 2>/dev/null || echo unknown)
    if [[ "\$status" == "healthy" ]]; then
        echo "  ✓ backend healthy"
        break
    fi
    sleep 5
done

# 3d. Smoke-test через localhost
echo '▶ Smoke-test /api/health'
curl --fail --silent --show-error http://localhost:5001/api/health | head -1 || \
    { echo '  ✗ health endpoint не ответил'; exit 1; }
echo
echo '  ✓ health endpoint жив'
REMOTE_SCRIPT

# =============================================================
# 4. Финал
# =============================================================
echo
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Деплой завершён.${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"

cat <<EOF

${YELLOW}API доступен:${NC}
  https://api.spbu-pmi.ru/api/health
  https://api.spbu-pmi.ru/api/docs   (Swagger)

${YELLOW}Полезные команды:${NC}
  Логи бэка:
      ssh $USER_NAME@$HOST 'cd $APP_DIR && docker compose --env-file .env.production -f $COMPOSE_FILE logs -f backend'
  Логи Caddy:
      ssh $USER_NAME@$HOST 'cd $APP_DIR && docker compose --env-file .env.production -f $COMPOSE_FILE logs -f caddy'
  Перезапустить только бэк:
      ssh $USER_NAME@$HOST 'cd $APP_DIR && docker compose --env-file .env.production -f $COMPOSE_FILE up -d --build backend'
EOF
