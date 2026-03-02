import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { GroupsList } from '../../features/adapter';
import { SubmissionsList } from '../../features/adapter';
import { Button } from '../../shared/ui/Button';

export function AdapterPage() {
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>();

  if (!selectedGroup) {
    return (
      <View className="flex-1 bg-background">
        <View className="px-4 pt-4 pb-2">
          <Text className="text-xl font-bold text-textPrimary">
            Выберите группу
          </Text>
          <Text className="text-sm text-textSecondary mt-1">
            Для просмотра заявок студентов
          </Text>
        </View>
        <GroupsList
          onSelectGroup={setSelectedGroup}
          selectedGroup={selectedGroup}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View>
          <Text className="text-xl font-bold text-textPrimary">
            Группа {selectedGroup}
          </Text>
          <Text className="text-sm text-textSecondary mt-0.5">
            Заявки студентов
          </Text>
        </View>
        <Button
          title="Назад"
          variant="ghost"
          onPress={() => setSelectedGroup(undefined)}
        />
      </View>
      <SubmissionsList group={selectedGroup} />
    </View>
  );
}

