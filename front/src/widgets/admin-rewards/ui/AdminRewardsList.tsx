import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '@shared/ui/EmptyState';
import { IconButton } from '@shared/ui/IconButton';
import { BagIcon, DeleteIcon, TrophyIcon } from '@shared/ui/icons';
import { useConfirm, useToast } from '@shared/ui';
import { extractErrorMessage } from '@shared/api';
import {
  useArchiveReward,
  useRewards,
  type Reward,
} from '@entities/reward';

/**
 * Виджет «список лотов магазина в админке». Композирует:
 *  - entity Reward (useRewards, useArchiveReward)
 *  - shared/ui (EmptyState, IconButton)
 *
 * Подтверждение удаления через useConfirm с destructive-кнопкой.
 */
export function AdminRewardsList(): React.ReactElement {
  const { data, isLoading, refetch, isRefetching } = useRewards();
  const archive = useArchiveReward();
  const toast = useToast();
  const confirm = useConfirm();

  const handleDelete = async (reward: Reward): Promise<void> => {
    const ok = await confirm({
      title: `Удалить «${reward.title}»?`,
      message: 'Лот пропадёт из магазина. Уже оформленные заказы сохранятся.',
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    archive.mutate(reward.id, {
      onSuccess: () => toast.show('Лот удалён', 'success'),
      onError: (err) =>
        toast.show(extractErrorMessage(err, 'Не удалось удалить'), 'error'),
    });
  };

  const renderItem = ({ item }: { item: Reward }): React.ReactElement => (
    <View className="rounded-2xl bg-surface border border-border overflow-hidden flex-row">
      <View className="w-24 h-24 bg-surface-secondary items-center justify-center">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : (
          <TrophyIcon size={32} color="rgb(148 163 184)" />
        )}
      </View>

      <View className="flex-1 p-3 pr-12">
        <Text
          className="text-sm font-semibold text-text-primary"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text className="text-xs text-text-muted mt-1">
          {item.price} баллов
        </Text>
      </View>

      <View className="absolute top-2 right-2">
        <IconButton
          Icon={DeleteIcon}
          tone="danger"
          onPress={() => void handleDelete(item)}
          disabled={archive.isPending}
          accessibilityLabel="Удалить"
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={data ?? []}
        keyExtractor={(reward) => reward.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        ListEmptyComponent={
          isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator />
            </View>
          ) : (
            <EmptyState
              Icon={BagIcon}
              title="Магазин пуст"
              description="Добавьте первый лот во вкладке «Создать»"
            />
          )
        }
      />
    </View>
  );
}
