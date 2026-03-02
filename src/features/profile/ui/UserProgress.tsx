import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '../../../shared/ui/Card';

interface UserProgressProps {
  completed: number;
  total: number;
}

export function UserProgress({ completed, total }: UserProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="mx-4">
      <Text className="text-base font-semibold text-textPrimary mb-3">
        Общий прогресс по ачивкам
      </Text>

      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-textSecondary">
          {completed} из {total}
        </Text>
        <Text className="text-sm font-bold text-primary-600">{percentage}%</Text>
      </View>

      <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <View
          className="h-full bg-primary-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </Card>
  );
}

