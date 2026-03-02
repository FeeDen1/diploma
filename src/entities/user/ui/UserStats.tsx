import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '../../../shared/ui/Card';

interface UserStatsProps {
  totalPoints: number;
  completedAchievements: number;
  totalAchievements: number;
  rank?: number;
}

export function UserStats({
  totalPoints,
  completedAchievements,
  totalAchievements,
  rank,
}: UserStatsProps) {
  const stats = [
    { label: 'Баллы', value: String(totalPoints) },
    { label: 'Выполнено', value: `${completedAchievements}/${totalAchievements}` },
    ...(rank ? [{ label: 'Место', value: `#${rank}` }] : []),
  ];

  return (
    <View className="flex-row gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex-1 items-center py-4">
          <Text className="text-2xl font-bold text-primary-600">
            {stat.value}
          </Text>
          <Text className="text-xs text-textSecondary mt-1">
            {stat.label}
          </Text>
        </Card>
      ))}
    </View>
  );
}

