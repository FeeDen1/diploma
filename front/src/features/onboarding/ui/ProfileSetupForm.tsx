import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@shared/ui/Button';
import { extractErrorMessage } from '@shared/api';
import { storage } from '@shared/lib/storage';
import {
  DIRECTIONS,
  DIRECTION_LABELS,
  type Direction,
} from '@shared/api/groups';
import { useGroups, useJoinGroup } from '@entities/group';
import { useMe } from '@entities/user';

export function ProfileSetupForm(): React.ReactElement {
  const [direction, setDirection] = useState<Direction | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: me } = useMe();
  const { data: groups, isLoading: groupsLoading } = useGroups(
    direction ? { direction } : {},
  );
  const joinGroup = useJoinGroup();

  const sortedGroups = useMemo(
    () =>
      (groups ?? [])
        .slice()
        .sort((first, second) => first.name.localeCompare(second.name)),
    [groups],
  );

  const handleSubmit = (): void => {
    if (!me) {
      setError('Не удалось определить пользователя');
      return;
    }
    if (!direction) {
      setError('Выберите направление');
      return;
    }
    if (!groupId) {
      setError('Выберите группу');
      return;
    }

    setError('');
    joinGroup.mutate(
      { groupId },
      {
        onSuccess: async () => {
          await storage.setProfileSetupCompleted();
          router.replace('/(tabs)/achievements');
        },
        onError: (err) =>
          setError(extractErrorMessage(err, 'Не удалось сохранить группу')),
      },
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-text-primary mb-2">
          Выбор группы
        </Text>
        <Text className="text-base text-text-secondary mb-8">
          Укажи своё направление и академическую группу
        </Text>

        {error ? (
          <View className="bg-error/10 rounded-xl p-3 mb-4">
            <Text className="text-sm text-error">{error}</Text>
          </View>
        ) : null}

        <Text className="text-sm font-medium text-text-primary mb-2">
          Направление
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {DIRECTIONS.map((directionOption) => {
            const selected = direction === directionOption;
            return (
              <TouchableOpacity
                key={directionOption}
                onPress={() => {
                  setDirection(directionOption);
                  setGroupId(null);
                }}
                activeOpacity={0.7}
                className={`px-5 py-3 rounded-xl border ${
                  selected
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    selected ? 'text-white' : 'text-text-primary'
                  }`}
                >
                  {DIRECTION_LABELS[directionOption]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {direction ? (
          <>
            <Text className="text-sm font-medium text-text-primary mb-2">
              Академическая группа
            </Text>
            {groupsLoading ? (
              <ActivityIndicator color="rgb(79 70 229)" />
            ) : (
              <View className="flex-row flex-wrap gap-2 mb-8">
                {sortedGroups.map((group) => {
                  const selected = groupId === group.id;
                  return (
                    <TouchableOpacity
                      key={group.id}
                      onPress={() => setGroupId(group.id)}
                      activeOpacity={0.7}
                      className={`px-4 py-3 rounded-xl border ${
                        selected
                          ? 'bg-primary border-primary'
                          : 'bg-surface border-border'
                      }`}
                    >
                      <Text
                        className={`text-base font-medium ${
                          selected ? 'text-white' : 'text-text-primary'
                        }`}
                      >
                        {group.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        ) : null}

        <Button
          title="Продолжить"
          onPress={handleSubmit}
          loading={joinGroup.isPending}
          fullWidth
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
