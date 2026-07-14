import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '@shared/ui/Badge';
import { TrophyIcon } from '@shared/ui/icons';
import { TASK_CATEGORY_LABELS } from '@shared/api/tasks';
import {
  formatDeadline,
  getDeadlineSeverity,
  isRecentlyCreated,
  type DeadlineSeverity,
} from '@shared/lib/date';
import type {
  AchievementStatus,
  AchievementView,
} from '../lib/useAchievementsView';

interface Props {
  achievement: AchievementView;
  onPress?: () => void;
}

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

const STATUS_BADGE: Record<
  AchievementStatus,
  { text: string; variant: BadgeVariant }
> = {
  available: { text: 'Доступно', variant: 'default' },
  pending: { text: 'На проверке', variant: 'warning' },
  approved: { text: 'Засчитано', variant: 'success' },
  rejected: { text: 'Отклонено', variant: 'error' },
};

const DEADLINE_BADGE_VARIANT: Record<DeadlineSeverity, BadgeVariant> = {
  expired: 'error',
  soon: 'warning',
  normal: 'info',
};

export function AchievementCard({
  achievement,
  onPress,
}: Props): React.ReactElement {
  const status = STATUS_BADGE[achievement.status];
  const deadline = achievement.expiresAt;
  const deadlineSeverity = deadline ? getDeadlineSeverity(deadline) : null;
  const deadlineLabel = deadline ? formatDeadline(deadline) : null;
  // «Новое» — только пока студент ещё не сдал, иначе маркер бессмысленен
  // (для approved/pending/rejected статус важнее новизны).
  const showNewBadge =
    achievement.status === 'available' &&
    isRecentlyCreated(achievement.createdAt);
  // Кликабельны: доступные (новая сдача) и отклонённые (перезалить фото).
  const clickable =
    !achievement.isExpired &&
    (achievement.status === 'available' || achievement.status === 'rejected');

  return (
    <TouchableOpacity
      activeOpacity={clickable ? 0.85 : 1}
      onPress={clickable ? onPress : undefined}
      style={{ width: '50%', padding: 6 }}
    >
      <View className="rounded-2xl bg-surface border border-border overflow-hidden">
        <View className="aspect-square w-full bg-surface-secondary items-center justify-center">
          {achievement.coverUrl ? (
            <Image
              source={{ uri: achievement.coverUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <TrophyIcon size={48} color="rgb(148 163 184)" />
          )}
          <View className="absolute top-2 right-2">
            <Badge text={status.text} variant={status.variant} />
          </View>
          {showNewBadge ? (
            <View className="absolute top-2 left-2">
              <Badge text="Новое" variant="info" />
            </View>
          ) : null}
          {deadlineLabel && deadlineSeverity ? (
            <View className="absolute bottom-2 left-2">
              <Badge
                text={deadlineLabel}
                variant={DEADLINE_BADGE_VARIANT[deadlineSeverity]}
              />
            </View>
          ) : null}
        </View>
        <View className="p-3">
          {/*
            Блок фиксированной высоты в 2 строки — чтобы все карточки были
            одной высоты. justify-center центрирует заголовок по вертикали:
            у коротких (однострочных) названий пустота делится поровну сверху
            и снизу.
          */}
          <View style={{ height: 36, justifyContent: 'center' }}>
            <Text
              className="text-sm font-semibold text-text-primary"
              numberOfLines={2}
              style={{ lineHeight: 18 }}
            >
              {achievement.title}
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-2">
            <Text
              className="text-xs text-text-muted flex-1 mr-2"
              numberOfLines={1}
            >
              {TASK_CATEGORY_LABELS[achievement.category]}
            </Text>
            <Text className="text-sm font-bold text-primary">
              +{achievement.points}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
