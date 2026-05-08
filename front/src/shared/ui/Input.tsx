import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

/**
 * Без локального focus-state — иначе при каждом focus/blur Input ре-рендерится
 * и его рамка перекрашивается, что заметно дёргается на iOS-симуляторе во время
 * анимации поднятия клавиатуры. Фокус-стейт можно вернуть позже через
 * useReducedMotion и без перекраски бордера.
 */
export function Input({
  label,
  error,
  containerClassName,
  className,
  ...props
}: InputProps) {
  return (
    <View className={`mb-4 ${containerClassName ?? ''}`}>
      {label && (
        <Text className="text-sm font-medium text-text-primary mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className={`
          border rounded-xl px-4 py-3 text-base text-text-primary bg-surface
          ${error ? 'border-error' : 'border-border'}
          ${className ?? ''}
        `}
        placeholderTextColor="rgb(148 163 184)"
        {...props}
      />
      {error && <Text className="text-xs text-error mt-1">{error}</Text>}
    </View>
  );
}
