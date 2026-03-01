import React from 'react';
import { TouchableOpacity, type ViewStyle } from 'react-native';
import type { IconProps } from './icons';

export type IconButtonTone = 'default' | 'danger' | 'primary' | 'success';

interface IconButtonProps {
  /** Любой компонент-иконка из shared/ui/icons. */
  Icon: React.ComponentType<IconProps>;
  onPress: () => void;
  tone?: IconButtonTone;
  size?: number;
  hitSlop?: number;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: ViewStyle;
}

const TONE_COLOR: Record<IconButtonTone, string> = {
  default: 'rgb(100 116 139)', // text-secondary
  danger: 'rgb(239 68 68)', // error
  primary: 'rgb(99 102 241)', // primary
  success: 'rgb(34 197 94)',
};

/**
 * Универсальная кнопка-иконка. Иконка передаётся как компонент (Icon prop),
 * цвет управляется toned'ом — это даёт консистентность через весь UI и
 * позволяет менять реализацию иконки в одном месте.
 */
export function IconButton({
  Icon,
  onPress,
  tone = 'default',
  size = 20,
  hitSlop = 10,
  disabled = false,
  accessibilityLabel,
  style,
}: IconButtonProps): React.ReactElement {
  const color = TONE_COLOR[tone];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      style={style}
    >
      <Icon color={color} size={size} />
    </TouchableOpacity>
  );
}
