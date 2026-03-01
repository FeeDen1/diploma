import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function SearchIcon({ color, size = 24 }: IconProps): React.ReactElement {
  return <Ionicons name="search" size={size} color={color} />;
}
