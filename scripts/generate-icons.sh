#!/usr/bin/env bash
#
# generate-icons.sh — генерирует PNG-иконки для Expo.
#
# Запуск:
#   bash scripts/generate-icons.sh
#
# Что делает:
#   1) Ставит sharp если его нет в front/node_modules
#   2) Иконки приложения — из растрового логотипа front/assets/icon-source.png:
#        icon.png          (1024×1024, белый фон, без альфы — для iOS/App Store)
#        adaptive-icon.png (1024×1024, логотип обрезан от полей и вписан в ~62%
#                           центра — безопасная зона Android-маски, фон белый)
#        favicon.png       (48×48)
#   3) Сплэш — из front/assets/splash-icon.svg → splash-icon.png (800×800)
#
# Хочешь поменять иконку приложения — замени front/assets/icon-source.png и
# прогони скрипт. Сплэш по-прежнему из splash-icon.svg.

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

async function svgToPng(svgPath, outPath, size) {
    const svg = fs.readFileSync(svgPath);
    await sharp(svg, { density: 600 })
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(outPath);
    logSize(outPath, size);
}

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

(async () => {
    await buildAppIcon(1024);
    await buildAdaptiveIcon(1024);
    await svgToPng('assets/splash-icon.svg', 'assets/splash-icon.png', 800);
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
