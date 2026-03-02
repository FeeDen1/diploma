import React from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined';
}

export function Card({
  variant = 'elevated',
  className,
  children,
  ...props
}: CardProps) {
  const baseStyle = 'rounded-2xl p-4 bg-surface';
  const variantStyle =
    variant === 'elevated'
      ? 'shadow-sm shadow-black/10'
      : 'border border-border';

  return (
    <View className={`${baseStyle} ${variantStyle} ${className ?? ''}`} {...props}>
      {children}
    </View>
  );
}

