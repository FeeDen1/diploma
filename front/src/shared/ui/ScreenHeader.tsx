import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronBackIcon } from './icons';

interface ScreenHeaderProps {
  title: string;
  /** Опциональный кастомный обработчик «назад». По умолчанию router.back(). */
  onBack?: () => void;
  /** Скрыть кнопку назад (для рутовых экранов). */
  hideBack?: boolean;
  /** Контент справа: дополнительные действия. */
  rightSlot?: React.ReactNode;
}

/**
 * Шапка экрана: кнопка «назад» + заголовок + опциональные действия справа.
 * Используется в not-tab экранах (my-submissions, my-orders и т.п.).
 */
export function ScreenHeader({
  title,
  onBack,
  hideBack = false,
  rightSlot,
}: ScreenHeaderProps): React.ReactElement {
  const handleBack = onBack ?? (() => router.back());

  return (
    <View className="flex-row items-center px-3 pt-2 pb-2">
      {hideBack ? (
        <View style={{ width: 40 }} />
      ) : (
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel="Назад"
          hitSlop={10}
          className="w-10 h-10 items-center justify-center"
        >
          <ChevronBackIcon size={24} color="rgb(100 116 139)" />
        </TouchableOpacity>
      )}
      <Text
        className="flex-1 text-xl font-bold text-text-primary ml-1"
        numberOfLines={1}
      >
        {title}
      </Text>
      {rightSlot ? <View>{rightSlot}</View> : null}
    </View>
  );
}
