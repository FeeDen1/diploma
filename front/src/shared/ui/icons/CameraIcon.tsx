import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconProps } from './types';

export function CameraIcon({ color, size = 24 }: IconProps): React.ReactElement {
  return <Ionicons name="camera" size={size} color={color} />;
}
