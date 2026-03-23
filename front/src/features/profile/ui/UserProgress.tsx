import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../../../shared/ui/Card';

interface Props {
  completed: number;
  total: number;
}

export function UserProgress({ completed, total }: Props): React.ReactElement {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="mx-4">
      <Text className="text-base font-semibold text-text-primary mb-3">
        Прогресс по заданиям
      </Text>

      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-text-secondary">
          {completed} из {total}
        </Text>
        <Text className="text-sm font-bold text-primary">{percentage}%</Text>
      </View>

      <View className="h-3 bg-surface-secondary rounded-full overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </Card>
  );
}
