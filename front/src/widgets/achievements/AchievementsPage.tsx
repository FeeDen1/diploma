import React from 'react';
import { View } from 'react-native';
import { AchievementsList } from '../../features/achievements';

export function AchievementsPage() {
  return (
    <View className="flex-1 bg-background">
      <AchievementsList />
    </View>
  );
}

