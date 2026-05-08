import React from 'react';
import { Text, View } from 'react-native';
import { AlbumsIcon, type IconProps } from './icons';

interface EmptyStateProps {
  /** Компонент-иконка из shared/ui/icons. По умолчанию AlbumsIcon. */
  Icon?: React.ComponentType<IconProps>;
  title: string;
  description?: string;
}

export function EmptyState({
  Icon = AlbumsIcon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-12 px-6">
      <Icon size={64} color="rgb(203 213 225)" />
      <Text className="text-lg font-semibold text-text-primary mt-4 text-center">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-text-secondary mt-2 text-center">
          {description}
        </Text>
      )}
    </View>
  );
}
