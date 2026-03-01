import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function ChevronBackIcon({
  color,
  size = 24,
}: IconProps): React.ReactElement {
  return <Ionicons name="chevron-back" size={size} color={color} />;
}
