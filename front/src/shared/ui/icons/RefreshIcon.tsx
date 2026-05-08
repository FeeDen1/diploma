import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function RefreshIcon({ color, size = 24 }: IconProps): React.ReactElement {
  return <Ionicons name="refresh-outline" size={size} color={color} />;
}
