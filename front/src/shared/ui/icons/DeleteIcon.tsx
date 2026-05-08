import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function DeleteIcon({ color, size = 24 }: IconProps): React.ReactElement {
  return <Ionicons name="trash-outline" size={size} color={color} />;
}
