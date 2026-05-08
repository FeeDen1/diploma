import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { FilterChip } from '../../../shared/ui/FilterChip';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ArchiveIcon } from '../../../shared/ui/icons';
import { useConfirm, useToast } from '../../../shared/ui';
import { extractErrorMessage } from '../../../shared/api';
import {
  flattenInfiniteTasks,
  useArchiveTask,
  useInfiniteTasks,
  useUnarchiveTask,
  type Task,
} from '../../../entities/task';
import { EditTaskSheet } from '../../../features/admin';
import { AdminTaskRow, type AdminTasksScope } from './AdminTaskRow';

/**
 * Виджет «список заданий в админке». Композирует:
 *  - entity Task (useInfiniteTasks, useArchiveTask, useUnarchiveTask)
 *  - feature EditTaskSheet
 *  - shared/ui (FilterChip, EmptyState, IconButton через AdminTaskRow)
 *
 * Состояние выбранного scope (active/archive) и редактируемой задачи —
 * локальное для виджета.
 */
export function AdminTasksList(): React.ReactElement {
  const [scope, setScope] = useState<AdminTasksScope>('active');
  const [editing, setEditing] = useState<Task | null>(null);

  const tasksQuery = useInfiniteTasks({
    includeArchived: scope === 'archive' ? true : undefined,
  });
  const archive = useArchiveTask();
  const unarchive = useUnarchiveTask();
  const toast = useToast();
  const confirm = useConfirm();

  const data = useMemo<Task[]>(() => {
    const all = flattenInfiniteTasks(tasksQuery.data);
    // На бэке для админа в active-режиме архив скрыт. Дополнительно фильтруем
    // на FE для архивного режима, чтобы видеть только архивные.
    if (scope === 'archive') return all.filter((task) => task.isArchived);
    return all;
  }, [tasksQuery.data, scope]);

  const handleArchive = async (task: Task): Promise<void> => {
    const ok = await confirm({
      title: `Удалить «${task.title}»?`,
      message:
        'Задание скроется из списка студентов. Сабмиты и баллы сохранятся — задание можно вернуть из архива.',
      confirmText: 'В архив',
      destructive: true,
    });
    if (!ok) return;
    archive.mutate(task.id, {
      onSuccess: () => toast.show('Задание в архиве', 'success'),
      onError: (err) =>
        toast.show(extractErrorMessage(err, 'Не удалось'), 'error'),
    });
  };

  const handleRestore = (task: Task): void => {
    unarchive.mutate(task.id, {
      onSuccess: () => toast.show('Задание восстановлено', 'success'),
      onError: (err) =>
        toast.show(extractErrorMessage(err, 'Не удалось'), 'error'),
    });
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
        data={data}
        keyExtractor={(task) => task.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <AdminTaskRow
            task={item}
            scope={scope}
            onEdit={() => setEditing(item)}
            onArchive={() => void handleArchive(item)}
            onRestore={() => handleRestore(item)}
            archiving={archive.isPending}
            restoring={unarchive.isPending}
          />
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (tasksQuery.hasNextPage && !tasksQuery.isFetchingNextPage) {
            void tasksQuery.fetchNextPage();
          }
        }}
        refreshing={tasksQuery.isRefetching}
        onRefresh={() => void tasksQuery.refetch()}
        ListEmptyComponent={
          tasksQuery.isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator />
            </View>
          ) : (
            <EmptyState
              Icon={ArchiveIcon}
              title={scope === 'active' ? 'Нет активных заданий' : 'Архив пуст'}
              description={
                scope === 'active'
                  ? 'Создайте новое задание во вкладке «Создать»'
                  : 'Архивные задания появятся здесь'
              }
            />
          )
        }
        ListFooterComponent={
          tasksQuery.isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator />
            </View>
          ) : null
        }
      />

      <EditTaskSheet task={editing} onClose={() => setEditing(null)} />
    </View>
  );
}
