import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
import { Avatar } from '@shared/ui/Avatar';
import { EmptyState } from '@shared/ui/EmptyState';
import { PodiumIcon } from '@shared/ui/icons';
import { DIRECTION_LABELS } from '@shared/api/groups';
import type { Direction } from '@shared/api/groups';
import { type LeaderboardSort } from '@shared/api/leaderboard';
import {
  useLeaderboard,
  type LeaderboardEntry,
} from '@entities/leaderboard';
import { LeaderboardFilters } from '@features/leaderboard';

const PAGE_SIZE = 20;

/**
 * Виджет таблицы лидерборда. Композирует:
 *  - feature LeaderboardFilters (выбор направления/группы)
 *  - entity useLeaderboard (запрос с пагинацией и сортировкой)
 *  - TanStack Table с manualPagination/manualSorting
 *
 * Всё состояние пагинации и сортировки локально для виджета — pages/leaderboard
 * остаётся тонкой обёрткой и не знает о деталях.
 */
export function LeaderboardTable(): React.ReactElement {
  const [direction, setDirection] = useState<Direction | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'ratingTotal', desc: true },
  ]);

  // Конвертируем react-table sorting в формат бэка
  const sortKey: LeaderboardSort = useMemo(() => {
    const primarySort = sorting[0];
    if (!primarySort) return 'rating-desc';
    if (primarySort.id === 'ratingTotal') {
      return primarySort.desc ? 'rating-desc' : 'rating-asc';
    }
    if (primarySort.id === 'name') {
      return primarySort.desc ? 'name-desc' : 'name-asc';
    }
    return 'rating-desc';
  }, [sorting]);

  const { data, isLoading, isFetching } = useLeaderboard({
    direction: direction ?? undefined,
    groupId: groupId ?? undefined,
    sort: sortKey,
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  });

  const rows: LeaderboardEntry[] = data?.entries ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const columns = useMemo<ColumnDef<LeaderboardEntry>[]>(
    () => [
      { id: 'rank', header: '#', accessorKey: 'rank', enableSorting: false },
      {
        id: 'name',
        header: 'Студент',
        accessorKey: 'fullName',
        enableSorting: true,
      },
      {
        id: 'group',
        header: 'Группа',
        accessorFn: (row) =>
          row.direction && row.groupName
            ? `${DIRECTION_LABELS[row.direction]} · ${row.groupName}`
            : '—',
        enableSorting: false,
      },
      {
        id: 'ratingTotal',
        header: 'Баллы',
        accessorKey: 'ratingTotal',
        enableSorting: true,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: true,
    manualSorting: true,
    pageCount,
  });

  const handleFilterChange = {
    direction: (nextDirection: Direction | null) => {
      setDirection(nextDirection);
      setPagination({ pageIndex: 0, pageSize: PAGE_SIZE });
    },
    group: (nextGroupId: string | null) => {
      setGroupId(nextGroupId);
      setPagination({ pageIndex: 0, pageSize: PAGE_SIZE });
    },
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="rgb(79 70 229)" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <LeaderboardFilters
        direction={direction}
        groupId={groupId}
        onDirectionChange={handleFilterChange.direction}
        onGroupChange={handleFilterChange.group}
      />

      {/* Хедер таблицы */}
      <View className="flex-row px-4 py-2 border-b border-border">
        {table.getHeaderGroups()[0]?.headers.map((header) => {
          const canSort = header.column.getCanSort();
          const sortDir = header.column.getIsSorted();
          return (
            <TouchableOpacity
              key={header.id}
              activeOpacity={canSort ? 0.7 : 1}
              onPress={() => {
                if (canSort) header.column.toggleSorting();
              }}
              style={{ flex: columnFlex(header.id) }}
              className="flex-row items-center"
            >
              <Text className="text-xs font-semibold text-text-secondary uppercase">
                {String(header.column.columnDef.header)}
              </Text>
              {sortDir ? (
                <Text className="text-xs text-primary ml-1">
                  {sortDir === 'desc' ? '↓' : '↑'}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Тело */}
      <View className="flex-1">
        {rows.length === 0 ? (
          <EmptyState
            Icon={PodiumIcon}
            title="Пусто"
            description="С выбранными фильтрами никого не нашли"
          />
        ) : (
          table.getRowModel().rows.map((row) => {
            const entry = row.original;
            return (
              <View
                key={row.id}
                className="flex-row items-center px-4 py-3 border-b border-border"
              >
                <View
                  style={{ flex: columnFlex('rank') }}
                  className="flex-row items-center"
                >
                  <Text className="text-base font-bold text-text-primary">
                    {entry.rank}
                  </Text>
                </View>
                <View
                  style={{ flex: columnFlex('name') }}
                  className="flex-row items-center"
                >
                  <Avatar
                    uri={entry.avatarUrl}
                    name={entry.fullName}
                    size="sm"
                  />
                  <Text
                    className="ml-2 text-sm font-medium text-text-primary flex-1"
                    numberOfLines={1}
                  >
                    {entry.fullName}
                  </Text>
                </View>
                <View style={{ flex: columnFlex('group') }}>
                  <Text
                    className="text-xs text-text-secondary"
                    numberOfLines={1}
                  >
                    {entry.direction && entry.groupName
                      ? `${DIRECTION_LABELS[entry.direction]} · ${entry.groupName}`
                      : '—'}
                  </Text>
                </View>
                <View
                  style={{ flex: columnFlex('ratingTotal') }}
                  className="items-end"
                >
                  <Text className="text-sm font-bold text-primary">
                    {entry.ratingTotal}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Пагинация */}
      <View className="flex-row items-center justify-between px-4 py-2 border-t border-border bg-surface">
        <Text className="text-sm text-text-secondary">
          Стр. {pagination.pageIndex + 1} из {pageCount}
          {isFetching ? ' …' : ''}
        </Text>
        <View className="flex-row" style={{ gap: 8 }}>
          <PagerButton
            label="←"
            onPress={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          />
          <PagerButton
            label="→"
            onPress={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          />
        </View>
      </View>
    </View>
  );
}

interface PagerButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Локальный для виджета помощник: маленькая 40×40 кнопка пагинации.
 * Не выносим в shared — слишком узко (только две стрелки и состояние disabled).
 */
function PagerButton({
  label,
  onPress,
  disabled,
}: PagerButtonProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      className={`w-10 h-10 rounded-xl items-center justify-center border ${
        disabled
          ? 'border-border bg-surface-secondary opacity-50'
          : 'border-primary bg-primary-soft'
      }`}
    >
      <Text
        className={`text-base font-bold ${
          disabled ? 'text-text-muted' : 'text-primary'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** Колонки в одинаковых пропорциях по всему рендеру (хедер и строки). */
function columnFlex(id: string): number {
  switch (id) {
    case 'rank':
      return 0.6;
    case 'name':
      return 2.5;
    case 'group':
      return 1.4;
    case 'ratingTotal':
      return 1;
    default:
      return 1;
  }
}
