import React, { useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

interface UploadedImageProps {
  /** URL картинки. */
  uri: string;
  /** Скругление углов. По умолчанию 12. */
  borderRadius?: number;
  /**
   * Максимальная высота. Защищает вёрстку от очень вытянутых вертикальных
   * фото, которые иначе растянули бы карточку на пол-экрана.
   */
  maxHeight?: number;
  /**
   * Пропорция (width / height), пока реальные размеры файла ещё не загружены.
   * 4/3 — нейтральный дефолт, близкий к большинству фото с телефона.
   */
  fallbackAspectRatio?: number;
  /** Доп. стили картинки (например marginTop). */
  style?: StyleProp<ImageStyle>;
}

/**
 * Картинка пользовательской загрузки, которая показывается ЦЕЛИКОМ в своих
 * реальных пропорциях.
 *
 * Обычный <Image> с фиксированной высотой проигрывает в любом случае:
 *  - resizeMode="cover"   — заполняет контейнер, но обрезает края фото;
 *  - resizeMode="contain" — показывает фото целиком, но оставляет пустые
 *    поля сверху/снизу или по бокам.
 *
 * UploadedImage читает фактические width/height файла из onLoad-события и
 * подгоняет aspectRatio контейнера ровно под фото. Картинка не режется и
 * не «плавает» в пустоте — контейнер всегда повторяет её форму.
 *
 * maxHeight ограничивает совсем вытянутые вертикальные фото; в этом редком
 * случае срабатывает resizeMode="contain" как страховка.
 */
export function UploadedImage({
  uri,
  borderRadius = 12,
  maxHeight = 420,
  fallbackAspectRatio = 4 / 3,
  style,
}: UploadedImageProps): React.ReactElement {
  const [aspectRatio, setAspectRatio] = useState(fallbackAspectRatio);

  return (
    <Image
      source={{ uri }}
      style={[
        {
          width: '100%',
          aspectRatio,
          maxHeight,
          borderRadius,
          // Лёгкий фон — если из-за maxHeight фото впишется с полями,
          // края выглядят аккуратно, а не как «дыра» в карточке.
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        },
        style,
      ]}
      // contain — страховка на время, пока aspectRatio ещё fallback,
      // и для редкого случая срабатывания maxHeight.
      resizeMode="contain"
      onLoad={(event) => {
        const { width, height } = event.nativeEvent.source;
        if (width > 0 && height > 0) {
          setAspectRatio(width / height);
        }
      }}
    />
  );
}
