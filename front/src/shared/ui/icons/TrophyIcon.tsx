import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function TrophyIcon({ color, size = 24 }: IconProps): React.ReactElement {
  return <Ionicons name="trophy-outline" size={size} color={color} />;
}
