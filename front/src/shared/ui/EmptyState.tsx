import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({
  icon = 'albums-outline',
  title,
  description,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-12 px-6">
      <Icon name={icon} size={64} color="#CBD5E1" />
      <Text className="text-lg font-semibold text-textPrimary mt-4 text-center">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-textSecondary mt-2 text-center">
          {description}
        </Text>
      )}
    </View>
  );
}
