import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function BagIcon({ color, size = 24 }: IconProps): React.ReactElement {
  return <Ionicons name="bag-outline" size={size} color={color} />;
}
