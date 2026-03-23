import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  type TaskCategory,
} from '../../../shared/api/tasks';

interface Props {
  selected: TaskCategory | null;
  onSelect: (category: TaskCategory | null) => void;
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function Chip({ label, active, onPress }: ChipProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`px-3 h-9 rounded-full border items-center justify-center ${
        active ? 'bg-primary border-primary' : 'bg-surface border-border'
      }`}
    >
      <Text
        className={`text-xs font-medium ${
          active ? 'text-white' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function AchievementFilters({
  selected,
  onSelect,
}: Props): React.ReactElement {
  return (
    <View className="flex-row flex-wrap px-4 py-3" style={{ gap: 6 }}>
      <Chip
        label="Все"
        active={selected === null}
        onPress={() => onSelect(null)}
      />
      {TASK_CATEGORIES.map((category) => (
        <Chip
          key={category}
          label={TASK_CATEGORY_LABELS[category]}
          active={selected === category}
          onPress={() => onSelect(selected === category ? null : category)}
        />
      ))}
    </View>
  );
}
