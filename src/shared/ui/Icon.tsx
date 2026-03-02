import React from 'react';
import { Text } from 'react-native';

const iconMap: Record<string, string> = {
  // Onboarding
  'school-outline': '🎓',
  'trophy-outline': '🏆',
  'podium-outline': '🥇',
  'rocket-outline': '🚀',
  // Tabs
  'person-outline': '👤',
  'settings-outline': '⚙️',
  'clipboard-outline': '📋',
  // Achievement types
  'fitness-outline': '💪',
  'book-outline': '📚',
  'color-palette-outline': '🎨',
  'heart-outline': '❤️',
  'star-outline': '⭐',
  // UI
  'chevron-forward': '›',
  'camera': '📷',
  'albums-outline': '📁',
  'close': '✕',
  'search': '🔍',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color }: IconProps) {
  const emoji = iconMap[name] ?? '●';
  return (
    <Text style={{ fontSize: size * 0.7, color, textAlign: 'center', lineHeight: size }}>
      {emoji}
    </Text>
  );
}

