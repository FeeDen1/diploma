import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from '../../../shared/ui/Icon';
import { Card } from '../../../shared/ui/Card';
import { Badge } from '../../../shared/ui/Badge';
import type { UserAchievement, AchievementStatus } from '../model/types';

interface AchievementCardProps {
  achievement: UserAchievement;
  onPress?: () => void;
}

const statusConfig: Record<AchievementStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  available: { label: 'Доступно', variant: 'info' },
  pending: { label: 'На проверке', variant: 'warning' },
  completed: { label: 'Выполнено', variant: 'success' },
  rejected: { label: 'Отклонено', variant: 'error' },
};

const typeIcons: Record<string, string> = {
  'Спорт': 'fitness-outline',
  'Учёба': 'book-outline',
  'Творчество': 'color-palette-outline',
  'Волонтёрство': 'heart-outline',
  'Другое': 'star-outline',
};

export function AchievementCard({ achievement, onPress }: AchievementCardProps) {
  const statusInfo = statusConfig[achievement.status];
  const icon = typeIcons[achievement.type] ?? 'star-outline';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="mb-3">
        <View className="flex-row items-start">
          <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mr-3">
            <Icon name={icon} size={20} color="#4F46E5" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-semibold text-textPrimary flex-1 mr-2">
                {achievement.title}
              </Text>
              <Badge text={statusInfo.label} variant={statusInfo.variant} />
            </View>
            <Text className="text-sm text-textSecondary mb-2" numberOfLines={2}>
              {achievement.description}
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-textSecondary">{achievement.type}</Text>
              <Text className="text-sm font-bold text-primary-600">
                +{achievement.points} б.
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
