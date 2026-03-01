import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function ChevronForwardIcon({
  color,
  size = 24,
}: IconProps): React.ReactElement {
  return <Ionicons name="chevron-forward" size={size} color={color} />;
}
