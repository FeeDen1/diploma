import React from 'react';
import { View, TextInput } from 'react-native';
import { Icon } from './Icon';

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
    <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5">
      <Icon name="search" size={20} color="#94A3B8" />
      <TextInput
        className="flex-1 ml-2 text-base text-textPrimary"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
    </View>
  );
}
