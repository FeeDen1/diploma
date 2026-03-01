import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  error: { bg: 'bg-red-100', text: 'text-red-700' },
  info: { bg: 'bg-blue-100', text: 'text-blue-700' },
  default: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export function Badge({ text, variant = 'default' }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View className={`px-2.5 py-1 rounded-full ${styles.bg}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{text}</Text>
    </View>
  );
}

