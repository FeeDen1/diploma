#!/usr/bin/env bash
#
# bootstrap-server.sh — первоначальная настройка чистого Ubuntu 24.04 VPS
# для деплоя PM-Task. Запускается ОДИН РАЗ, от root, на свежем сервере.
#
# Что делает:
#   1) Полностью обновляет ОС
#   2) Создаёт non-root пользователя `pmtask` с sudo и SSH-ключом из root
#   3) Ставит Docker Engine + Compose plugin (официальный репозиторий Docker)
#   4) Конфигурирует firewall (ufw): пускаем только 22, 80, 443
#   5) Ставит fail2ban против brute-force на SSH
#   6) Включает автоматические security-обновления
#   7) Готовит sshd_config для безопасного логина (но НЕ рестартит SSH —
#      это последний шаг, который ты сделаешь руками после проверки)
#
# Применение:
#   scp scripts/bootstrap-server.sh root@45.157.163.3:/root/
#   ssh root@45.157.163.3 "bash /root/bootstrap-server.sh"
#
# Скрипт идемпотентный: можно запускать повторно (например, после
# обновлений), он не сломается на «уже-сделано».

set -euo pipefail

# =============================================================
# Параметры
# =============================================================
NEW_USER="pmtask"
APP_DIR="/opt/pmtask"

# Цвета для логов
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "\n${BLUE}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $*${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $*${NC}"; }
fail() { echo -e "${RED}  ✗ $*${NC}" >&2; exit 1; }

# =============================================================
# 0. Предполётные проверки
# =============================================================
[[ $EUID -eq 0 ]] || fail "запускай от root: sudo bash $0"
[[ -f /etc/os-release ]] || fail "не Linux?"
. /etc/os-release
[[ "$ID" == "ubuntu" ]] || fail "ожидается Ubuntu, получено $ID"

step "Сервер: $PRETTY_NAME ($(uname -m))"
ok "проверка ОС пройдена"

# =============================================================
# 1. Обновление пакетов
# =============================================================
step "Обновление пакетной базы и установленных пакетов"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
apt-get install -y \
    ca-certificates curl gnupg lsb-release \
    ufw fail2ban unattended-upgrades \
    git htop ncdu jq
ok "пакеты обновлены"

# =============================================================
# 2. Non-root пользователь
# =============================================================
step "Создание пользователя $NEW_USER"
if id "$NEW_USER" >/dev/null 2>&1; then
    ok "пользователь $NEW_USER уже существует"
else
    adduser --disabled-password --gecos "" "$NEW_USER"
    ok "пользователь $NEW_USER создан"
fi

# sudo без пароля (для удобства автодеплоя; компромисс безопасности).
# Если сервер критичный — поменяй на стандартное `sudo` (с паролем) и
# поставь надёжный пароль через `passwd $NEW_USER`.
echo "$NEW_USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-${NEW_USER}"
chmod 0440 "/etc/sudoers.d/90-${NEW_USER}"
ok "sudo (NOPASSWD) настроен"

# Копируем SSH-ключи из /root в нового юзера (Selectel положил твой
# публичный ключ в /root/.ssh/authorized_keys при создании сервера)
if [[ -f /root/.ssh/authorized_keys ]]; then
    install -d -m 700 -o "$NEW_USER" -g "$NEW_USER" "/home/$NEW_USER/.ssh"
    install -m 600 -o "$NEW_USER" -g "$NEW_USER" \
        /root/.ssh/authorized_keys "/home/$NEW_USER/.ssh/authorized_keys"
    ok "SSH-ключ скопирован в /home/$NEW_USER/.ssh/authorized_keys"
else
    warn "/root/.ssh/authorized_keys нет — добавь ключ для $NEW_USER вручную"
fi

# =============================================================
# 3. Docker Engine + Compose plugin (официальный репо Docker)
# =============================================================
step "Установка Docker Engine"
if command -v docker >/dev/null 2>&1; then
    ok "docker уже установлен ($(docker --version))"
else
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # shellcheck disable=SC1091
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        > /etc/apt/sources.list.d/docker.list

    apt-get update -y
    apt-get install -y \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
    ok "docker установлен ($(docker --version))"
fi

# Включаем автозапуск
systemctl enable --now docker
ok "docker запущен и в автозапуске"

# Добавляем pmtask в группу docker (чтобы не нужен был sudo для docker-команд)
usermod -aG docker "$NEW_USER"
ok "$NEW_USER добавлен в группу docker"

# =============================================================
# 4. Firewall (ufw)
# =============================================================
step "Настройка ufw (firewall)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ok "ufw активен: разрешены только 22/80/443"

# =============================================================
# 5. fail2ban (защита SSH от brute-force)
# =============================================================
step "Настройка fail2ban для SSH"
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled  = true
port     = ssh
logpath  = %(sshd_log)s
backend  = systemd
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban
ok "fail2ban активен (5 попыток за 10 минут → бан на 1 час)"

# =============================================================
# 6. Автоматические security-обновления
# =============================================================
step "Включение unattended-upgrades для security-патчей"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
ok "security-обновления применяются автоматически каждый день"

# =============================================================
# 7. Подготовка SSH-конфигурации (НЕ рестарт)
# =============================================================
step "Подготовка sshd_config (без рестарта SSH)"
SSHD_CONF="/etc/ssh/sshd_config.d/99-pmtask.conf"
cat > "$SSHD_CONF" <<'EOF'
# Безопасные дефолты для прода
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
ok "конфиг записан в $SSHD_CONF"
warn "SSH-демон НЕ перезапущен. Сделай это вручную, когда убедишься, что"
warn "залогиниться как $NEW_USER ты можешь. Иначе можешь себя запереть."

# =============================================================
# 8. Подготовка папки приложения
# =============================================================
step "Создание $APP_DIR для приложения"
install -d -m 0755 -o "$NEW_USER" -g "$NEW_USER" "$APP_DIR"
ok "$APP_DIR готов"

# =============================================================
# Финал
# =============================================================
echo
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Bootstrap завершён.${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"

cat <<EOF

${YELLOW}Дальше — твои руки:${NC}

  1) ${BLUE}Открой новое окно терминала${NC} и проверь, что логин под $NEW_USER работает:
       ssh $NEW_USER@$(hostname -I | awk '{print $1}' || echo "<IP>")

     Должен зайти БЕЗ ВВОДА ПАРОЛЯ. Если зашёл — всё ок.

  2) Если логин под $NEW_USER работает, ${BLUE}только тогда${NC} перезапусти SSH-демон:
       systemctl restart ssh

     Это активирует:
       - PermitRootLogin no       (root SSH запрещён)
       - PasswordAuthentication no (только по ключу)

  3) Если что-то пошло не так — Selectel даёт VNC-консоль через панель,
     можно зайти туда и откатить настройки SSH:
       rm /etc/ssh/sshd_config.d/99-pmtask.conf
       systemctl restart ssh

${YELLOW}Что дальше:${NC}
  - Папка для приложения: $APP_DIR (владелец $NEW_USER)
  - Клонировать репо в неё, положить .env.production, docker compose up
EOF
