import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { Card } from '../../../shared/ui/Card';
import { EmptyState } from '../../../shared/ui/EmptyState';
import type { Direction } from '../../../shared/config/api';
import type { LeaderboardEntry } from '../../../entities/leaderboard';
import { LeaderboardFilters } from './LeaderboardFilters';
import { useLeaderboard } from '../api/leaderboardApi';

export function LeaderboardTable() {
  const [direction, setDirection] = useState<Direction | undefined>();
  const [group, setGroup] = useState<string | undefined>();

  const { data: entries, isLoading, refetch } = useLeaderboard({ direction, group });

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    const isTopThree = item.rank <= 3;
    const rankColors = ['', 'text-yellow-500', 'text-gray-400', 'text-amber-600'];

    return (
      <Card className="mb-2 flex-row items-center" variant="outlined">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            isTopThree ? 'bg-primary-50' : 'bg-gray-50'
          }`}
        >
          <Text
            className={`text-base font-bold ${
              isTopThree ? rankColors[item.rank] ?? 'text-primary-600' : 'text-textSecondary'
            }`}
          >
            {item.rank}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-textPrimary">
            {item.userName}
          </Text>
          <Text className="text-xs text-textSecondary">
            {item.direction} · Гр. {item.group}
          </Text>
        </View>
        <Text className="text-base font-bold text-primary-600">
          {item.totalPoints} б.
        </Text>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <LeaderboardFilters
        selectedDirection={direction}
        selectedGroup={group}
        onDirectionChange={setDirection}
        onGroupChange={setGroup}
      />

      <FlatList
        data={entries}
        keyExtractor={(item) => item.userId}
        renderItem={renderEntry}
        contentContainerClassName="px-4 pb-4"
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon="podium-outline"
            title="Рейтинг пуст"
            description="Пока нет участников с выбранными фильтрами"
          />
        }
      />
    </View>
  );
}

