import React, { useState } from 'react';
import {
  Image,
  TouchableOpacity,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import ImageView from 'react-native-image-viewing';

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
  /**
   * Открывать ли фото на весь экран по тапу — с pinch-to-zoom, double-tap
   * и свайпом для закрытия. По умолчанию true.
   */
  zoomable?: boolean;
}

/**
 * Картинка пользовательской загрузки, которая показывается ЦЕЛИКОМ в своих
 * реальных пропорциях, а по тапу открывается на весь экран с зумом.
 *
 * Обычный <Image> с фиксированной высотой проигрывает в любом случае:
 *  - resizeMode="cover"   — заполняет контейнер, но обрезает края фото;
 *  - resizeMode="contain" — показывает фото целиком, но оставляет пустые
 *    поля сверху/снизу или по бокам.
 *
 * UploadedImage читает фактические width/height файла из onLoad-события и
 * подгоняет aspectRatio контейнера ровно под фото. Картинка не режется и
 * не «плавает» в пустоте.
 *
 * Тап по картинке открывает полноэкранный просмотрщик (react-native-image-
 * viewing): pinch-to-zoom, double-tap, свайп вниз для закрытия. Удобно
 * рассматривать фото-доказательства сабмишенов в деталях.
 */
export function UploadedImage({
  uri,
  borderRadius = 12,
  maxHeight = 420,
  fallbackAspectRatio = 4 / 3,
  style,
  zoomable = true,
}: UploadedImageProps): React.ReactElement {
  const [aspectRatio, setAspectRatio] = useState(fallbackAspectRatio);
  const [viewerVisible, setViewerVisible] = useState(false);

  const image = (
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

  if (!zoomable) return image;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setViewerVisible(true)}
      >
        {image}
      </TouchableOpacity>

      <ImageView
        images={[{ uri }]}
        imageIndex={0}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
      />
    </>
  );
}
