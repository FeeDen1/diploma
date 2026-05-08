import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary border border-primary',
  secondary: 'bg-surface-secondary border border-border',
  outline: 'bg-transparent border border-primary',
  ghost: 'bg-transparent border border-transparent',
  danger: 'bg-error border border-error',
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-text-primary',
  outline: 'text-primary',
  ghost: 'text-primary',
  danger: 'text-white',
};

const indicatorColor: Record<ButtonVariant, string> = {
  primary: '#fff',
  secondary: '#0F172A',
  outline: '#4F46E5',
  ghost: '#4F46E5',
  danger: '#fff',
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`
        rounded-xl px-6 py-3.5 items-center justify-center flex-row
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
        ${className ?? ''}
      `}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={indicatorColor[variant]}
          className="mr-2"
        />
      )}
      <Text className={`text-base font-semibold ${variantTextStyles[variant]}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
