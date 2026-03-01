import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`
        px-4 py-2 rounded-full mr-2 border
        ${selected ? 'bg-primary border-primary' : 'bg-surface border-border'}
      `}
    >
      <Text
        className={`text-sm font-medium ${selected ? 'text-white' : 'text-text-secondary'}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
