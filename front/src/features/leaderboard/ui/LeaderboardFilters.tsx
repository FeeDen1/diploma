import React from 'react';
import { View, ScrollView } from 'react-native';
import { FilterChip } from '../../../shared/ui/FilterChip';
import { DIRECTIONS, GROUPS_BY_DIRECTION, type Direction } from '../../../shared/config/api';

interface LeaderboardFiltersProps {
  selectedDirection: Direction | undefined;
  selectedGroup: string | undefined;
  onDirectionChange: (direction: Direction | undefined) => void;
  onGroupChange: (group: string | undefined) => void;
}

export function LeaderboardFilters({
  selectedDirection,
  selectedGroup,
  onDirectionChange,
  onGroupChange,
}: LeaderboardFiltersProps) {
  const availableGroups = selectedDirection
    ? GROUPS_BY_DIRECTION[selectedDirection]
    : [];

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 py-2"
      >
        <FilterChip
          label="Все"
          selected={!selectedDirection}
          onPress={() => {
            onDirectionChange(undefined);
            onGroupChange(undefined);
          }}
        />
        {DIRECTIONS.map((dir) => (
          <FilterChip
            key={dir}
            label={dir}
            selected={selectedDirection === dir}
            onPress={() => {
              onDirectionChange(selectedDirection === dir ? undefined : dir);
              onGroupChange(undefined);
            }}
          />
        ))}
      </ScrollView>

      {selectedDirection && availableGroups.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 pb-2"
        >
          <FilterChip
            label="Все группы"
            selected={!selectedGroup}
            onPress={() => onGroupChange(undefined)}
          />
          {availableGroups.map((g) => (
            <FilterChip
              key={g}
              label={`Гр. ${g}`}
              selected={selectedGroup === g}
              onPress={() => onGroupChange(selectedGroup === g ? undefined : g)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

