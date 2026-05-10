import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { FilterChip } from '@shared/ui/FilterChip';
import {
  DIRECTIONS,
  DIRECTION_LABELS,
  type Direction,
} from '@shared/api/groups';
import { useGroups } from '@entities/group';

interface Props {
  direction: Direction | null;
  groupId: string | null;
  onDirectionChange: (direction: Direction | null) => void;
  onGroupChange: (groupId: string | null) => void;
}

export function LeaderboardFilters({
  direction,
  groupId,
  onDirectionChange,
  onGroupChange,
}: Props): React.ReactElement {
  const { data: groups } = useGroups(direction ? { direction } : {});
  const sortedGroups = useMemo(
    () =>
      (groups ?? [])
        .slice()
        .sort((first, second) => first.name.localeCompare(second.name)),
    [groups],
  );

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          alignItems: 'center',
        }}
      >
        <FilterChip
          label="Все"
          selected={direction === null}
          onPress={() => {
            onDirectionChange(null);
            onGroupChange(null);
          }}
        />
        {DIRECTIONS.map((directionOption) => (
          <FilterChip
            key={directionOption}
            label={DIRECTION_LABELS[directionOption]}
            selected={direction === directionOption}
            onPress={() => {
              onDirectionChange(direction === directionOption ? null : directionOption);
              onGroupChange(null);
            }}
          />
        ))}
      </ScrollView>

      {direction ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 pb-2"
        >
          <FilterChip
            label="Все группы"
            selected={groupId === null}
            onPress={() => onGroupChange(null)}
          />
          {sortedGroups.map((group) => (
            <FilterChip
              key={group.id}
              label={group.name}
              selected={groupId === group.id}
              onPress={() => onGroupChange(groupId === group.id ? null : group.id)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
