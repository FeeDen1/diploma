import React from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { AlbumsIcon, ChevronForwardIcon } from '@shared/ui/icons';
import { DIRECTION_LABELS } from '@shared/api/groups';
import { useMyGroups } from '@entities/group';
import type { Group } from '@entities/group';

interface Props {
  onSelectGroup: (group: Group) => void;
  selectedGroupId?: string | null;
}

export function GroupsList({ onSelectGroup, selectedGroupId }: Props): React.ReactElement {
  const { data, isLoading } = useMyGroups();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="rgb(79 70 229)" />
      </View>
    );
  }

  const curated = data?.curatorOf ?? [];
  if (curated.length === 0) {
    return (
      <EmptyState
        Icon={AlbumsIcon}
        title="Нет курируемых групп"
        description="Администратор ещё не назначил вас куратором ни одной группы."
      />
    );
  }

  return (
    <FlatList
      data={curated}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const selected = selectedGroupId === item.id;
        return (
          <TouchableOpacity onPress={() => onSelectGroup(item)} activeOpacity={0.7}>
            <Card
              className={`mb-2 flex-row items-center justify-between ${
                selected ? 'border border-primary' : ''
              }`}
              variant="outlined"
            >
              <View>
                <Text className="text-base font-semibold text-text-primary">
                  {item.name}
                </Text>
                <Text className="text-sm text-text-secondary">
                  {DIRECTION_LABELS[item.direction]} · {item.year}
                </Text>
              </View>
              <ChevronForwardIcon
                size={20}
                color={selected ? 'rgb(79 70 229)' : 'rgb(148 163 184)'}
              />
            </Card>
          </TouchableOpacity>
        );
      }}
      contentContainerClassName="px-4 pb-4"
      showsVerticalScrollIndicator={false}
    />
  );
}
