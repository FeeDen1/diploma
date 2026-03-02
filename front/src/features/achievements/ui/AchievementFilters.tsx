import React from 'react';
import { ScrollView } from 'react-native';
import { FilterChip } from '../../../shared/ui/FilterChip';
import { ACHIEVEMENT_TYPES, type AchievementType } from '../../../shared/config/api';

interface AchievementFiltersProps {
  selectedType: AchievementType | null;
  onSelectType: (type: AchievementType | null) => void;
}

export function AchievementFilters({
  selectedType,
  onSelectType,
}: AchievementFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-3"
    >
      <FilterChip
        label="Все"
        selected={selectedType === null}
        onPress={() => onSelectType(null)}
      />
      {ACHIEVEMENT_TYPES.map((type) => (
        <FilterChip
          key={type}
          label={type}
          selected={selectedType === type}
          onPress={() => onSelectType(selectedType === type ? null : type)}
        />
      ))}
    </ScrollView>
  );
}

