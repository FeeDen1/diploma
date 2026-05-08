import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function InfoIcon({ color, size = 24 }: IconProps): React.ReactElement {
  return <Ionicons name="information-circle-outline" size={size} color={color} />;
}
