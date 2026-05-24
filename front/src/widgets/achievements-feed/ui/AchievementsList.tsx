import React, { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { EmptyState } from '@shared/ui/EmptyState';
import { TrophyIcon } from '@shared/ui/icons';
import type { TasksSort } from '@shared/api/tasks';
import {
  useAchievementsView,
  type AchievementView,
} from '@features/achievements/lib/useAchievementsView';
import {
  AchievementCard,
  AchievementFilters,
  EMPTY_ACHIEVEMENT_FILTERS,
  SubmitAchievementSheet,
  type AchievementFiltersValue,
} from '@features/achievements';

/**
 * Лента заданий студента — виджет, композирующий несколько features:
 * фильтры по категориям (AchievementFilters), карточки заданий
 * (AchievementCard) и шит сдачи (SubmitAchievementSheet).
 *
 * Использует виртуализованный FlatList с infinite-scroll и pull-to-refresh.
 */
export function AchievementsList(): React.ReactElement {
  const [filters, setFilters] = useState<AchievementFiltersValue>(
    EMPTY_ACHIEVEMENT_FILTERS,
  );
  const [sort] = useState<TasksSort>('deadline');
  const [active, setActive] = useState<{
    achievement: AchievementView;
    resubmitId?: string;
  } | null>(null);

  const view = useAchievementsView({ filters, sort });

  if (view.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="rgb(79 70 229)" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <AchievementFilters value={filters} onChange={setFilters} />

      <FlatList
        data={view.data}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <AchievementCard
            achievement={item}
            onPress={() => {
              if (item.status === 'available') {
                setActive({ achievement: item });
              } else if (item.status === 'rejected' && item.submission) {
                setActive({ achievement: item, resubmitId: item.submission.id });
              }
            }}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        refreshing={view.isRefreshing}
        onRefresh={view.refetch}
        onEndReached={() => {
          if (view.hasNextPage && !view.isFetchingNextPage) {
            view.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          view.isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator color="rgb(79 70 229)" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            Icon={TrophyIcon}
            title="Заданий не найдено"
            description="Попробуйте изменить фильтр"
          />
        }
      />

      <SubmitAchievementSheet
        achievement={active?.achievement ?? null}
        resubmitId={active?.resubmitId}
        onClose={() => setActive(null)}
      />
    </View>
  );
}
