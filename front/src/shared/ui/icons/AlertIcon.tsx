import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function AlertIcon({ color, size = 24 }: IconProps): React.ReactElement {
  return <Ionicons name="alert-circle-outline" size={size} color={color} />;
}
