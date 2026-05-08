import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { StarIcon } from '../../../shared/ui/icons';

export function ThemeToggle(): React.ReactElement {
  const { mode, toggle } = useTheme();
  const isDark = mode === 'dark';

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.7}
      className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-surface border border-border"
    >
      <View className="flex-row items-center">
        <StarIcon size={20} color="rgb(100 116 139)" />
        <Text className="ml-3 text-base text-text-primary font-medium">
          {isDark ? 'Тёмная тема' : 'Светлая тема'}
        </Text>
      </View>
      <View
        className={`w-12 h-7 rounded-full px-1 justify-center ${
          isDark ? 'bg-primary items-end' : 'bg-surface-secondary items-start'
        }`}
      >
        <View className="w-5 h-5 rounded-full bg-surface" />
      </View>
    </TouchableOpacity>
  );
}
