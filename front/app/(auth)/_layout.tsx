import React from 'react';
import { Stack } from 'expo-router';
import { useThemeColors } from '../../src/shared/theme';

export default function AuthLayout(): React.ReactElement {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
