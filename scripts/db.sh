#!/usr/bin/env bash
#
# db.sh — обёртки для админ-операций над production-базой PM-Task.
#
# Подкоманды:
#   shell                  — psql shell внутри контейнера на сервере
#   studio                 — Prisma Studio локально + SSH-туннель к prod-БД
#   make-admin <email>     — одной командой повысить юзера до admin
#   list-users             — табличка email/role/createdAt
#   backup                 — pg_dump → ./backups/pmtask-YYYYMMDD-HHMM.sql
#   restore <file.sql>     — залить дамп в prod-БД (с подтверждением)
#   reset                  — снести БД и пересоздать (с подтверждением)
#
# Подключение к серверу через DEPLOY_HOST/DEPLOY_USER (default 45.157.163.3 / pmtask).

set -euo pipefail

HOST="${DEPLOY_HOST:-45.157.163.3}"
USER_NAME="${DEPLOY_USER:-pmtask}"
APP_DIR="${DEPLOY_DIR:-/opt/pmtask}"
COMPOSE_FILE="docker-compose.production.yml"
LOCAL_TUNNEL_PORT="${LOCAL_TUNNEL_PORT:-5433}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "${BLUE}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $*${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $*${NC}"; }
fail() { echo -e "${RED}  ✗ $*${NC}" >&2; exit 1; }

ssh_remote() {
    ssh -o StrictHostKeyChecking=accept-new "$USER_NAME@$HOST" "$@"
}

# Запускает docker compose exec на сервере
docker_exec() {
    ssh_remote "cd $APP_DIR && docker compose --env-file .env.production -f $COMPOSE_FILE exec $*"
}

# Запускает docker compose exec БЕЗ TTY (для пайпов / неинтерактивно)
docker_exec_noninteractive() {
    ssh_remote "cd $APP_DIR && docker compose --env-file .env.production -f $COMPOSE_FILE exec -T $*"
}

# Извлекает значение переменной из локального .env.production
env_get() {
    local key="$1"
    grep -E "^${key}=" "$(dirname "$0")/../.env.production" | head -1 | cut -d= -f2-
}

# =============================================================
# Подкоманды
# =============================================================

cmd_shell() {
    step "psql shell в prod-БД (Ctrl-D для выхода)"
    # -t для interactive TTY (psql)
    ssh -t "$USER_NAME@$HOST" \
        "cd $APP_DIR && docker compose --env-file .env.production -f $COMPOSE_FILE exec postgres psql -U pmtask -d pmtask"
}

cmd_studio() {
    step "Открываю SSH-туннель к prod-Postgres + Prisma Studio"

    local pg_pass
    pg_pass=$(env_get POSTGRES_PASSWORD)
    [[ -n "$pg_pass" ]] || fail "POSTGRES_PASSWORD не найден в .env.production"

    # Проверяем, не занят ли локальный порт
    if lsof -i ":$LOCAL_TUNNEL_PORT" >/dev/null 2>&1; then
        fail "Порт $LOCAL_TUNNEL_PORT занят. Закрой существующий процесс или поставь LOCAL_TUNNEL_PORT=другой"
    fi

    # Запускаем SSH-туннель в фоне
    ssh -N -f -L "$LOCAL_TUNNEL_PORT:127.0.0.1:5432" "$USER_NAME@$HOST"
    local ssh_pid
    ssh_pid=$(pgrep -f "ssh -N -f -L $LOCAL_TUNNEL_PORT:127.0.0.1:5432" | head -1)
    ok "туннель открыт (PID $ssh_pid, локальный порт $LOCAL_TUNNEL_PORT)"

    # Завершаем туннель при выходе из скрипта
    trap 'echo; echo "Закрываю туннель..."; kill $ssh_pid 2>/dev/null || true' EXIT INT TERM

    cd "$(dirname "$0")/../back"
    DATABASE_URL="postgresql://pmtask:${pg_pass}@localhost:${LOCAL_TUNNEL_PORT}/pmtask" \
        npx prisma studio
}

cmd_make_admin() {
    local email="${1:-}"
    [[ -n "$email" ]] || fail "usage: $0 make-admin <email>"

    step "Делаю $email админом"
    docker_exec_noninteractive postgres psql -U pmtask -d pmtask \
        -c "UPDATE \"User\" SET role = 'admin' WHERE email = '$email' RETURNING id, email, role;"
}

cmd_list_users() {
    step "Список юзеров"
    docker_exec_noninteractive postgres psql -U pmtask -d pmtask \
        -c "SELECT email, role, \"createdAt\" FROM \"User\" ORDER BY \"createdAt\" DESC;"
}

cmd_backup() {
    local out_dir
    out_dir="$(dirname "$0")/../backups"
    mkdir -p "$out_dir"
    local out_file="$out_dir/pmtask-$(date +%Y%m%d-%H%M).sql"

    step "Снимаю дамп → $out_file"
    docker_exec_noninteractive postgres pg_dump -U pmtask pmtask > "$out_file"

    local size
    size=$(du -h "$out_file" | cut -f1)
    ok "готово: $out_file ($size)"
}

cmd_restore() {
    local file="${1:-}"
    [[ -n "$file" && -f "$file" ]] || fail "usage: $0 restore <path/to/dump.sql>"

    warn "Восстановление из $file ПЕРЕЗАПИШЕТ существующую prod-БД"
    read -r -p "Уверен? Напиши 'yes' для продолжения: " ans
    [[ "$ans" == "yes" ]] || fail "Отменено"

    step "Заливаю дамп"
    docker_exec_noninteractive postgres psql -U pmtask -d pmtask < "$file"
    ok "дамп залит"
}

cmd_reset() {
    warn "Это сотрёт ВСЮ prod-БД (включая юзеров и сабмиты)!"
    read -r -p "Уверен? Напиши 'reset' для продолжения: " ans
    [[ "$ans" == "reset" ]] || fail "Отменено"

    step "Делаю автобэкап перед reset"
    cmd_backup

    step "Опускаю стек с volume и поднимаю заново"
    ssh_remote "cd $APP_DIR && \
        docker compose --env-file .env.production -f $COMPOSE_FILE down -v && \
        docker compose --env-file .env.production -f $COMPOSE_FILE up -d"
    ok "БД пересоздана с нуля + миграции прокатились"
}

# =============================================================
# Маршрутизация
# =============================================================
case "${1:-}" in
    shell)        cmd_shell ;;
    studio)       cmd_studio ;;
    make-admin)   shift; cmd_make_admin "$@" ;;
    list-users)   cmd_list_users ;;
    backup)       cmd_backup ;;
    restore)      shift; cmd_restore "$@" ;;
    reset)        cmd_reset ;;
    ""|-h|--help)
        cat <<EOF
Использование:
  $0 shell                       — psql shell в prod-БД
  $0 studio                      — Prisma Studio через SSH-туннель
  $0 make-admin <email>          — повысить юзера до admin
  $0 list-users                  — список юзеров (email/role/createdAt)
  $0 backup                      — pg_dump → ./backups/pmtask-YYYYMMDD-HHMM.sql
  $0 restore <file.sql>          — залить дамп в prod-БД
  $0 reset                       — снести БД и пересоздать (автобэкап перед этим)

Переменные окружения:
  DEPLOY_HOST=$HOST
  DEPLOY_USER=$USER_NAME
  DEPLOY_DIR=$APP_DIR
  LOCAL_TUNNEL_PORT=$LOCAL_TUNNEL_PORT
EOF
        ;;
    *)
        fail "неизвестная команда: $1 (см. $0 --help)"
        ;;
esac
