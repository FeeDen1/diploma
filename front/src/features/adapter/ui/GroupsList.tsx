import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Icon } from '../../../shared/ui/Icon';
import { Card } from '../../../shared/ui/Card';
import { DIRECTIONS, GROUPS_BY_DIRECTION } from '../../../shared/config/api';

interface GroupsListProps {
  onSelectGroup: (group: string) => void;
  selectedGroup?: string;
}

interface GroupItem {
  direction: string;
  group: string;
}

export function GroupsList({ onSelectGroup, selectedGroup }: GroupsListProps) {
  const groups: GroupItem[] = DIRECTIONS.flatMap((dir) =>
    GROUPS_BY_DIRECTION[dir].map((g) => ({ direction: dir, group: g }))
  );

  return (
    <FlatList
      data={groups}
      keyExtractor={(item) => `${item.direction}-${item.group}`}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onSelectGroup(item.group)}
          activeOpacity={0.7}
        >
          <Card
            className={`mb-2 flex-row items-center justify-between ${
              selectedGroup === item.group ? 'border-primary-600 border' : ''
            }`}
            variant="outlined"
          >
            <View>
              <Text className="text-base font-semibold text-textPrimary">
                Группа {item.group}
              </Text>
              <Text className="text-sm text-textSecondary">{item.direction}</Text>
            </View>
            <Icon
              name="chevron-forward"
              size={20}
              color={selectedGroup === item.group ? '#4F46E5' : '#94A3B8'}
            />
          </Card>
        </TouchableOpacity>
      )}
      contentContainerClassName="px-4 pb-4"
      showsVerticalScrollIndicator={false}
    />
  );
}
