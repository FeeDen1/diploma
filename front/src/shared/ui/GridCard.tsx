import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { TrophyIcon } from '@shared/ui/icons';

interface Props {
  /** Заголовок. Всегда занимает высоту в 2 строки (для ровной сетки). */
  title: string;
  /** URL обложки. Если null/undefined — показывается плейсхолдер-кубок. */
  imageUrl?: string | null;
  onPress?: () => void;
  /** Прозрачность при нажатии. По умолчанию 0.85. */
  activeOpacity?: number;
  /** Приглушить карточку (например, лот не по карману). */
  dimmed?: boolean;
  /** Бейджи поверх обложки — позиционируются сами (absolute). */
  overlay?: React.ReactNode;
  /** Контент под заголовком (категория+баллы, цена и т.п.). */
  footer?: React.ReactNode;
}

/**
 * Базовая карточка сетки 2-в-ряд: квадратная обложка (или плейсхолдер),
 * заголовок фиксированной высоты в 2 строки, произвольный футер. Общая основа
 * для AchievementCard (задания) и RewardCard (магазин) — вёрстка карточки
 * живёт здесь, а специфика (бейджи, футер, логика клика) остаётся в них.
 */
export function GridCard({
  title,
  imageUrl,
  onPress,
  activeOpacity = 0.85,
  dimmed = false,
  overlay,
  footer,
}: Props): React.ReactElement {
  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      style={{ width: '50%', padding: 6 }}
    >
      <View
        className={`rounded-2xl bg-surface border border-border overflow-hidden ${
          dimmed ? 'opacity-60' : ''
        }`}
      >
        <View className="aspect-square w-full bg-surface-secondary items-center justify-center">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <TrophyIcon size={48} color="rgb(148 163 184)" />
          )}
          {overlay}
        </View>
        <View className="p-3">
          {/*
            Блок фиксированной высоты в 2 строки — чтобы все карточки были
            одной высоты. justify-center центрирует заголовок по вертикали:
            у коротких (однострочных) названий пустота делится поровну.
          */}
          <View style={{ height: 36, justifyContent: 'center' }}>
            <Text
              className="text-sm font-semibold text-text-primary"
              numberOfLines={2}
              style={{ lineHeight: 18 }}
            >
              {title}
            </Text>
          </View>
          {footer}
        </View>
      </View>
    </TouchableOpacity>
  );
}
