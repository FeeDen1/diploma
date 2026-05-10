import React from 'react';
import { Stack } from 'expo-router';
import { useThemeColors } from '@shared/theme';

export default function OnboardingLayout(): React.ReactElement {
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
