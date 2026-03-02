import React, { useState } from 'react';
import { View, TextInput, Text, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerClassName,
  className,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`mb-4 ${containerClassName ?? ''}`}>
      {label && (
        <Text className="text-sm font-medium text-textPrimary mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className={`
          border rounded-xl px-4 py-3 text-base text-textPrimary bg-surface
          ${isFocused ? 'border-primary-500' : 'border-border'}
          ${error ? 'border-error' : ''}
          ${className ?? ''}
        `}
        placeholderTextColor="#94A3B8"
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <Text className="text-xs text-error mt-1">{error}</Text>
      )}
    </View>
  );
}

