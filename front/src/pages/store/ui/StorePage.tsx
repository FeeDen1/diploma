import React, { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { EmptyState } from '@shared/ui/EmptyState';
import { TrophyIcon } from '@shared/ui/icons';
import { useMe } from '@entities/user';
import { useRewards, type Reward } from '@entities/reward';
import { RewardCard } from '@features/store/ui/RewardCard';
import { useRewardPurchase } from '@features/store/lib/useRewardPurchase';
import { useManualRefresh } from '@shared/lib/useManualRefresh';

/**
 * Страница магазина. Сетка лотов 2 колонки, тап → подтверждение покупки
 * через useRewardPurchase. Сама страница только показывает данные;
 * вся логика покупки и списания в feature.
 */
export function StorePage(): React.ReactElement {
  const { data: rewards, isLoading, refetch } = useRewards();
  const { data: me } = useMe();
  const { buy } = useRewardPurchase();
  const { refreshing, onRefresh } = useManualRefresh(refetch);

  // Повторный тап по иконке вкладки в таб-баре скроллит витрину наверх.
  const listRef = useRef<FlatList<Reward>>(null);
  useScrollToTop(listRef);

  const available = me?.availablePoints ?? 0;

  // Сначала лоты, которые по карману, потом остальные. Партиционирование
  // (а не sort) сохраняет исходный порядок бэка внутри каждой группы.
  const sortedRewards = useMemo(() => {
    const list = rewards ?? [];
    const affordable = list.filter((reward) => available >= reward.price);
    const rest = list.filter((reward) => available < reward.price);
    return [...affordable, ...rest];
  }, [rewards, available]);

  const renderItem = ({ item }: { item: Reward }): React.ReactElement => (
    <RewardCard
      reward={item}
      affordable={available >= item.price}
      onPress={() => void buy(item)}
    />
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-3 pb-2">
        <Text className="text-sm text-text-secondary">
          Доступно: {me?.availablePoints ?? 0} • Накоплено: {me?.ratingTotal ?? 0}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={sortedRewards}
        keyExtractor={(reward) => reward.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 24 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator />
            </View>
          ) : (
            <EmptyState
              Icon={TrophyIcon}
              title="Магазин пуст"
              description="Лоты появятся, когда админ их добавит"
            />
          )
        }
      />
    </View>
  );
}
