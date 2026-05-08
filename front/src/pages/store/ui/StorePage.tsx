import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { TrophyIcon } from '../../../shared/ui/icons';
import { useMe } from '../../../entities/user';
import { useRewards, type Reward } from '../../../entities/reward';
import { RewardCard } from '../../../features/store/ui/RewardCard';
import { useRewardPurchase } from '../../../features/store/lib/useRewardPurchase';

/**
 * Страница магазина. Сетка лотов 2 колонки, тап → подтверждение покупки
 * через useRewardPurchase. Сама страница только показывает данные;
 * вся логика покупки и списания в feature.
 */
export function StorePage(): React.ReactElement {
  const { data: rewards, isLoading, refetch, isRefetching } = useRewards();
  const { data: me } = useMe();
  const { buy } = useRewardPurchase();

  const renderItem = ({ item }: { item: Reward }): React.ReactElement => (
    <RewardCard
      reward={item}
      affordable={(me?.availablePoints ?? 0) >= item.price}
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
        data={rewards ?? []}
        keyExtractor={(reward) => reward.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 24 }}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
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
