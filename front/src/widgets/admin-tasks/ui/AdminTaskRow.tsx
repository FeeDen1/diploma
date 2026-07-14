import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '@shared/ui/Badge';
import { IconButton } from '@shared/ui/IconButton';
import {
  DeleteIcon,
  RefreshIcon,
  TrophyIcon,
} from '@shared/ui/icons';
import { TASK_CATEGORY_LABELS } from '@shared/api/tasks';
import {
  formatDeadline,
  getDeadlineSeverity,
  type DeadlineSeverity,
} from '@shared/lib/date';
import type { Task } from '@entities/task';

const DEADLINE_BADGE: Record<DeadlineSeverity, 'error' | 'warning' | 'info'> = {
  expired: 'error',
  soon: 'warning',
  normal: 'info',
};

export type AdminTasksScope = 'active' | 'archive';

interface Props {
  task: Task;
  scope: AdminTasksScope;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDeletePermanent: () => void;
  archiving: boolean;
  restoring: boolean;
  deleting: boolean;
}

/**
 * Строка списка заданий в админке. Локальный компонент виджета admin-tasks,
 * вынесен из основного файла для читаемости — отвечает только за отрисовку
 * одной задачи с действиями (редактировать / архивировать / восстановить).
 */
export function AdminTaskRow({
  task,
  scope,
  onEdit,
  onArchive,
  onRestore,
  onDeletePermanent,
  archiving,
  restoring,
  deleting,
}: Props): React.ReactElement {
  const deadlineSeverity = task.expiresAt
    ? getDeadlineSeverity(task.expiresAt)
    : null;
  const deadlineLabel = task.expiresAt ? formatDeadline(task.expiresAt) : null;

  // На активной карточке тап = редактировать. На архивной редактирование
  // запрещаем — задание уже не у студентов, изменения сохранять некуда.
  const handleCardPress = scope === 'active' ? onEdit : undefined;

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      activeOpacity={handleCardPress ? 0.85 : 1}
      disabled={!handleCardPress}
      className="rounded-2xl bg-surface border border-border overflow-hidden flex-row"
    >
      <View className="w-24 h-24 bg-surface-secondary items-center justify-center">
        {task.coverUrl ? (
          <Image
            source={{ uri: task.coverUrl }}
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
          {task.title}
        </Text>
        <Text className="text-xs text-text-muted mt-1">
          {TASK_CATEGORY_LABELS[task.category]} · +{task.points}
        </Text>
        {deadlineLabel && deadlineSeverity ? (
          <View className="mt-2 self-start">
            <Badge
              text={deadlineLabel}
              variant={DEADLINE_BADGE[deadlineSeverity]}
            />
          </View>
        ) : null}
      </View>

      <View className="absolute top-2 right-2" style={{ gap: 8 }}>
        {scope === 'active' ? (
          <IconButton
            Icon={DeleteIcon}
            tone="danger"
            onPress={onArchive}
            disabled={archiving}
            accessibilityLabel="Удалить"
          />
        ) : (
          <>
            <IconButton
              Icon={RefreshIcon}
              tone="primary"
              onPress={onRestore}
              disabled={restoring}
              accessibilityLabel="Восстановить"
            />
            <IconButton
              Icon={DeleteIcon}
              tone="danger"
              onPress={onDeletePermanent}
              disabled={deleting}
              accessibilityLabel="Удалить навсегда"
            />
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
