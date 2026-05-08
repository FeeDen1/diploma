import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function AlbumsIcon({ color, size = 24 }: IconProps): React.ReactElement {
  return <Ionicons name="albums-outline" size={size} color={color} />;
}
