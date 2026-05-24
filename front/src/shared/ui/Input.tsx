import React from 'react';
import {
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

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
  style,
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
        // ВАЖНО: размер шрифта задаётся через style ({ fontSize: 16 }), а НЕ
        // через утилиту text-base. text-base в NativeWind ставит ещё и
        // lineHeight: 24 — а TextInput на iOS с заданным lineHeight смещает
        // введённый текст вниз (placeholder при этом остаётся по центру).
        // fontSize без lineHeight даёт корректное вертикальное центрирование
        // на обеих платформах.
        className={`
          border rounded-xl px-4 py-3 text-text-primary bg-surface
          ${error ? 'border-error' : 'border-border'}
          ${className ?? ''}
        `}
        style={[{ fontSize: 16 }, style as StyleProp<TextStyle>]}
        placeholderTextColor="rgb(148 163 184)"
        {...props}
      />
      {error && <Text className="text-xs text-error mt-1">{error}</Text>}
    </View>
  );
}
