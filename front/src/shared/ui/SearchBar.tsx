import React from 'react';
import { TextInput, View } from 'react-native';
import { SearchIcon } from './icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Поиск...',
}: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-surface-secondary rounded-xl px-3 py-2.5">
      <SearchIcon size={20} color="rgb(148 163 184)" />
      <TextInput
        // fontSize через style, без text-base — см. комментарий в Input.tsx:
        // lineHeight у text-base ломает вертикальное центрирование TextInput на iOS.
        className="flex-1 ml-2 text-text-primary"
        style={{ fontSize: 16 }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgb(148 163 184)"
      />
    </View>
  );
}
