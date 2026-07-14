#!/usr/bin/env bash
#
# generate-icons.sh — генерирует PNG-иконки для Expo.
#
# Запуск:
#   bash scripts/generate-icons.sh
#
# Что делает:
#   1) Ставит sharp если его нет в front/node_modules
#   2) Всё из растрового логотипа front/assets/icon-source.png:
#        icon.png          (1024×1024, белый фон, без альфы — для iOS/App Store)
#        adaptive-icon.png (1024×1024, логотип обрезан от полей и вписан в ~62%
#                           центра — безопасная зона Android-маски, фон белый)
#        splash-icon.png   (1024×1024, логотип в ~72% на прозрачном холсте;
#                           фон сплэша — splash.backgroundColor в app.json)
#        notification-icon.png (96×96, белый силуэт монограммы «PM» на прозрачном —
#                           Android рисует по альфе, цвет из expo-notifications.color)
#        favicon.png       (48×48)
#
# Хочешь поменять иконку/сплэш — замени front/assets/icon-source.png и
# прогони скрипт.

set -euo pipefail

cd "$(dirname "$0")/../front"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $*${NC}"; }
step() { echo -e "${BLUE}▶ $*${NC}"; }

step "Проверяю наличие sharp"
if [ ! -d node_modules/sharp ]; then
    step "Устанавливаю sharp (одноразово, ~30 сек)"
    npm install --save-dev sharp
fi
ok "sharp готов"

step "Конвертирую SVG → PNG"
node <<'JS'
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function logSize(outPath, size) {
    const stats = fs.statSync(outPath);
    console.log(`  ✓ ${path.basename(outPath)} (${size}×${size}, ${(stats.size / 1024).toFixed(1)} KB)`);
}

const WHITE = '#ffffff';
const ICON_SOURCE = 'assets/icon-source.png';

// iOS/общий icon.png — квадрат 1024, белый фон, БЕЗ альфа-канала
// (App Store отклоняет иконки с прозрачностью).
async function buildAppIcon(size) {
    await sharp(ICON_SOURCE)
        .resize(size, size, { fit: 'cover' })
        .flatten({ background: WHITE })
        .png({ compressionLevel: 9 })
        .toFile('assets/icon.png');
    logSize('assets/icon.png', size);
}

// Android adaptive foreground — обрезаем белые поля логотипа и вписываем его
// в ~62% центра холста (безопасная зона круглой/сквиркл-маски), фон белый.
async function buildAdaptiveIcon(size) {
    const inner = Math.round(size * 0.62);
    const trimmed = await sharp(ICON_SOURCE).flatten({ background: WHITE }).trim().toBuffer();
    const logo = await sharp(trimmed)
        .resize(inner, inner, { fit: 'inside' })
        .flatten({ background: WHITE })
        .toBuffer();
    await sharp({ create: { width: size, height: size, channels: 3, background: WHITE } })
        .composite([{ input: logo, gravity: 'center' }])
        .png({ compressionLevel: 9 })
        .toFile('assets/adaptive-icon.png');
    logSize('assets/adaptive-icon.png', size);
}

// Splash — логотип обрезан от полей и вписан в ~72% прозрачного холста;
// фон задаётся в app.json (splash.backgroundColor = белый).
async function buildSplash(size) {
    const inner = Math.round(size * 0.72);
    const trimmed = await sharp(ICON_SOURCE).flatten({ background: WHITE }).trim().toBuffer();
    const logo = await sharp(trimmed).resize(inner, inner, { fit: 'inside' }).png().toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } } })
        .composite([{ input: logo, gravity: 'center' }])
        .png({ compressionLevel: 9 })
        .toFile('assets/splash-icon.png');
    logSize('assets/splash-icon.png', size);
}

// Android notification icon — система использует только альфа-канал и рисует
// белый силуэт (цвет задаётся отдельно в app.json → expo-notifications.color).
// Берём монограмму «PM» (левый-верхний фрагмент логотипа) — в статус-баре
// весь wordmark нечитаем. Тёмный ink → непрозрачный белый, фон → прозрачный.
async function buildNotificationIcon(size) {
    const inner = Math.round(size * 0.82);
    const trimmed = await sharp(ICON_SOURCE).flatten({ background: WHITE }).trim().toBuffer();
    const tm = await sharp(trimmed).metadata();
    const pm = await sharp(trimmed)
        .extract({ left: 0, top: 0, width: Math.round(tm.width * 0.52), height: Math.round(tm.height * 0.6) })
        .toBuffer();
    const grayLogo = await sharp(pm).grayscale().trim().resize(inner, inner, { fit: 'inside' }).toBuffer();
    const graySquare = await sharp({ create: { width: size, height: size, channels: 3, background: WHITE } })
        .composite([{ input: grayLogo, gravity: 'center' }])
        .png()
        .toBuffer();
    const mask = await sharp(graySquare).negate().threshold(120).extractChannel(0).png().toBuffer();
    await sharp({ create: { width: size, height: size, channels: 3, background: WHITE } })
        .joinChannel(mask)
        .png({ compressionLevel: 9 })
        .toFile('assets/notification-icon.png');
    logSize('assets/notification-icon.png', size);
}

(async () => {
    await buildAppIcon(1024);
    await buildAdaptiveIcon(1024);
    await buildSplash(1024);
    await buildNotificationIcon(96);
    await sharp(ICON_SOURCE)
        .resize(48, 48, { fit: 'cover' })
        .flatten({ background: WHITE })
        .png()
        .toFile('assets/favicon.png');
    logSize('assets/favicon.png', 48);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
JS

ok "Готово. PNG'шки лежат в front/assets/"
