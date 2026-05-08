import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageAssetLike {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  width?: number;
  height?: number;
}

export interface PreparedImage {
  uri: string;
  fileName: string;
  mimeType: string;
}

const ALREADY_WEBP = /\.webp$|image\/webp/i;
/** Длина наибольшей стороны после ресайза. 1920 — баланс качества и веса для дипломки. */
const MAX_DIMENSION = 1920;
/** WebP-качество: 0..1. 0.85 даёт ~50–60% от веса JPEG при визуально неотличимом качестве. */
const WEBP_QUALITY = 0.85;

/**
 * Готовит фото из ImagePicker к загрузке.
 *
 * Все исходные форматы (HEIC, JPEG, PNG, и т.д.) перегоняем в **WebP** с заодно
 * ресайзом по длинной стороне до MAX_DIMENSION. Это даёт:
 *  - универсальный формат, понятный любому клиенту (iOS/Android/web все умеют WebP);
 *  - экономия трафика 30–50% по сравнению с JPEG того же качества;
 *  - ровно один декодер на бэке, без libheif и прочей экзотики.
 *
 * Если файл уже WebP и в пределах MAX_DIMENSION — возвращаем оригинал без обработки.
 */
export async function prepareImageForUpload(
  asset: ImageAssetLike,
): Promise<PreparedImage> {
  const originalName = asset.fileName ?? `image-${Date.now()}.jpg`;
  const isAlreadyWebp =
    ALREADY_WEBP.test(asset.mimeType ?? '') || ALREADY_WEBP.test(originalName);

  const longestSide = Math.max(asset.width ?? 0, asset.height ?? 0);
  const needsResize = longestSide > MAX_DIMENSION;

  if (isAlreadyWebp && !needsResize) {
    return {
      uri: asset.uri,
      fileName: originalName,
      mimeType: 'image/webp',
    };
  }

  const actions: ImageManipulator.Action[] = [];
  if (needsResize) {
    if ((asset.width ?? 0) >= (asset.height ?? 0)) {
      actions.push({ resize: { width: MAX_DIMENSION } });
    } else {
      actions.push({ resize: { height: MAX_DIMENSION } });
    }
  }

  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    format: ImageManipulator.SaveFormat.WEBP,
    compress: WEBP_QUALITY,
  });

  const baseName = originalName.replace(/\.[^.]+$/, '');
  return {
    uri: result.uri,
    fileName: `${baseName}.webp`,
    mimeType: 'image/webp',
  };
}
