import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function SettingsIcon({
  color,
  size = 24,
}: IconProps): React.ReactElement {
  return <Ionicons name="settings-outline" size={size} color={color} />;
}
