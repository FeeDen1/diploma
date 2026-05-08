import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function CalendarIcon({
  color,
  size = 24,
}: IconProps): React.ReactElement {
  return <Ionicons name="calendar-outline" size={size} color={color} />;
}
