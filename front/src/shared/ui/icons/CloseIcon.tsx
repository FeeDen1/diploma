import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function CloseIcon({ color, size = 24 }: IconProps): React.ReactElement {
  return <Ionicons name="close" size={size} color={color} />;
}
