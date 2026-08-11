import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  /**
   * Поле пароля: маскирует ввод и показывает «глазик» для просмотра. Заодно это
   * обход блокировки вставки из буфера в замаскированные поля на части прошивок
   * (например OxygenOS/OnePlus) — показав пароль, вставку можно выполнить.
   */
  password?: boolean;
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
  password,
  ...props
}: InputProps) {
  const [revealed, setRevealed] = useState(false);
  const secure = password ? !revealed : props.secureTextEntry;

  return (
    <View className={`mb-4 ${containerClassName ?? ''}`}>
      {label && (
        <Text className="text-sm font-medium text-text-primary mb-1.5">
          {label}
        </Text>
      )}
      <View className="justify-center">
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
            ${password ? 'pr-12' : ''}
            ${className ?? ''}
          `}
          style={[{ fontSize: 16 }, style as StyleProp<TextStyle>]}
          placeholderTextColor="rgb(148 163 184)"
          {...props}
          // secureTextEntry после спреда — в режиме password им управляет глазик.
          secureTextEntry={secure}
        />
        {password ? (
          <TouchableOpacity
            onPress={() => setRevealed((prev) => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Скрыть пароль' : 'Показать пароль'}
            className="absolute right-3 top-0 bottom-0 justify-center"
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="rgb(148 163 184)"
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error && <Text className="text-xs text-error mt-1">{error}</Text>}
    </View>
  );
}
