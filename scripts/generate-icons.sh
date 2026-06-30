#!/usr/bin/env bash
#
# generate-icons.sh — конвертирует SVG-исходники в PNG для Expo.
#
# Запуск:
#   bash scripts/generate-icons.sh
#
# Что делает:
#   1) Ставит sharp если его нет в front/node_modules
#   2) Конвертит:
#        front/assets/icon.svg            → icon.png            (1024×1024)
#        front/assets/adaptive-icon.svg   → adaptive-icon.png   (1024×1024)
#        front/assets/splash-icon.svg     → splash-icon.png     (800×800)
#        front/assets/icon.svg            → favicon.png         (48×48)
#
# Хочешь поменять иконку — отредактируй .svg, прогоняй скрипт.

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
    const stats = fs.statSync(outPath);
    console.log(`  ✓ ${path.basename(outPath)} (${size}×${size}, ${(stats.size / 1024).toFixed(1)} KB)`);
}

(async () => {
    await svgToPng('assets/icon.svg', 'assets/icon.png', 1024);
    await svgToPng('assets/adaptive-icon.svg', 'assets/adaptive-icon.png', 1024);
    await svgToPng('assets/splash-icon.svg', 'assets/splash-icon.png', 800);
    await svgToPng('assets/icon.svg', 'assets/favicon.png', 48);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
JS

ok "Готово. PNG'шки лежат в front/assets/"
