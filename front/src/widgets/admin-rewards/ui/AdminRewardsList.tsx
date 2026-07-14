import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '@shared/ui/EmptyState';
import { FilterChip } from '@shared/ui/FilterChip';
import { IconButton } from '@shared/ui/IconButton';
import {
  BagIcon,
  DeleteIcon,
  RefreshIcon,
  TrophyIcon,
} from '@shared/ui/icons';
import { useConfirm, useToast } from '@shared/ui';
import { extractErrorMessage } from '@shared/api';
import {
  useArchiveReward,
  useRewards,
  useUnarchiveReward,
  type Reward,
} from '@entities/reward';
import { EditRewardSheet } from '@features/admin';

type RewardsScope = 'active' | 'archive';

/**
 * Виджет «список лотов магазина в админке». По аналогии с AdminTasksList:
 *  - scope active/archive (FilterChip);
 *  - active: тап по карточке → редактирование, кнопка удаления (в архив);
 *  - archive: кнопка восстановления в витрину.
 *
 * Композирует entity Reward (useRewards/useArchiveReward/useUnarchiveReward)
 * и feature EditRewardSheet.
 */
export function AdminRewardsList(): React.ReactElement {
  const [scope, setScope] = useState<RewardsScope>('active');
  const [editing, setEditing] = useState<Reward | null>(null);

  const { data, isLoading, refetch, isRefetching } = useRewards({
    includeArchived: scope === 'archive' ? true : undefined,
  });
  const archive = useArchiveReward();
  const unarchive = useUnarchiveReward();
  const toast = useToast();
  const confirm = useConfirm();

  const rewards = useMemo<Reward[]>(() => {
    const all = data ?? [];
    // В архивном режиме бэк отдаёт активные + архивные — оставляем только архив.
    if (scope === 'archive') return all.filter((reward) => reward.isArchived);
    return all;
  }, [data, scope]);

  const handleArchive = async (reward: Reward): Promise<void> => {
    const ok = await confirm({
      title: `Удалить «${reward.title}»?`,
      message:
        'Лот пропадёт из магазина. Уже оформленные заказы сохранятся — лот можно вернуть из архива.',
      confirmText: 'В архив',
      destructive: true,
    });
    if (!ok) return;
    archive.mutate(reward.id, {
      onSuccess: () => toast.show('Лот в архиве', 'success'),
      onError: (err) =>
        toast.show(extractErrorMessage(err, 'Не удалось удалить'), 'error'),
    });
  };

  const handleRestore = (reward: Reward): void => {
    unarchive.mutate(reward.id, {
      onSuccess: () => toast.show('Лот восстановлен', 'success'),
      onError: (err) =>
        toast.show(extractErrorMessage(err, 'Не удалось'), 'error'),
    });
  };

  const renderItem = ({ item }: { item: Reward }): React.ReactElement => {
    // На активной карточке тап = редактировать. На архивной — правки некуда
    // сохранять (лот не в витрине), поэтому тап отключаем.
    const handleCardPress =
      scope === 'active' ? () => setEditing(item) : undefined;

    return (
      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={handleCardPress ? 0.85 : 1}
        disabled={!handleCardPress}
        className="rounded-2xl bg-surface border border-border overflow-hidden flex-row"
      >
        <View className="w-24 h-24 bg-surface-secondary items-center justify-center">
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
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
          {scope === 'active' ? (
            <IconButton
              Icon={DeleteIcon}
              tone="danger"
              onPress={() => void handleArchive(item)}
              disabled={archive.isPending}
              accessibilityLabel="Удалить"
            />
          ) : (
            <IconButton
              Icon={RefreshIcon}
              tone="primary"
              onPress={() => handleRestore(item)}
              disabled={unarchive.isPending}
              accessibilityLabel="Восстановить"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-3 pb-2 flex-row">
        <FilterChip
          label="Активные"
          selected={scope === 'active'}
          onPress={() => setScope('active')}
        />
        <FilterChip
          label="Архив"
          selected={scope === 'archive'}
          onPress={() => setScope('archive')}
        />
      </View>

      <FlatList
        data={rewards}
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
              title={scope === 'active' ? 'Магазин пуст' : 'Архив пуст'}
              description={
                scope === 'active'
                  ? 'Добавьте первый лот во вкладке «Создать»'
                  : 'Удалённые лоты появятся здесь'
              }
            />
          )
        }
      />

      <EditRewardSheet reward={editing} onClose={() => setEditing(null)} />
    </View>
  );
}
