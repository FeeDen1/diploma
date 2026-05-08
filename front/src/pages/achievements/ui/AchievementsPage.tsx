import React from 'react';
import { View } from 'react-native';
import { AchievementsList } from '../../../widgets/achievements-feed';

/**
 * Страница «Задания» — тонкая обёртка над feature AchievementsList.
 * Сама не реализует UI, только определяет фон и контейнер.
 */
export function AchievementsPage(): React.ReactElement {
  return (
    <View className="flex-1 bg-background">
      <AchievementsList />
    </View>
  );
}
