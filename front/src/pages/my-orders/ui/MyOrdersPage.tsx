import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { ScreenHeader } from '@shared/ui/ScreenHeader';
import { BagIcon } from '@shared/ui/icons';
import { useMyRewardOrders, type RewardOrder } from '@entities/reward';

/**
 * Страница «Мои заказы». Открывается из профиля. Только чтение, без действий —
 * статус заказа сейчас не управляется на фронте.
 */
export function MyOrdersPage(): React.ReactElement {
  const { data, isLoading, refetch } = useMyRewardOrders();

  const renderItem = ({ item }: { item: RewardOrder }): React.ReactElement => (
    <Card className="mb-3" variant="outlined">
      <View className="flex-row">
        <View className="w-20 h-20 rounded-xl bg-surface-secondary items-center justify-center overflow-hidden">
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : null}
        </View>
        <View className="flex-1 ml-3">
          <Text
            className="text-base font-semibold text-text-primary"
            numberOfLines={2}
          >
            {item.itemTitle}
          </Text>
          <Text className="text-sm text-text-secondary mt-1">
            {item.itemPrice} баллов
          </Text>
          <Text className="text-xs text-text-muted mt-1">
            {item.createdAt.toLocaleString('ru-RU', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-background"
        edges={['top']}
      >
        <ActivityIndicator size="large" color="rgb(79 70 229)" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Мои заказы" />

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            Icon={BagIcon}
            title="Пока нет заказов"
            description="Загляните в магазин — там есть, что взять за баллы"
          />
        }
      />
    </SafeAreaView>
  );
}
