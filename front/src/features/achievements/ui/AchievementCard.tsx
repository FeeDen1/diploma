import React from 'react';
import { Text, View } from 'react-native';
import { Badge } from '@shared/ui/Badge';
import { GridCard } from '@shared/ui/GridCard';
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
    <GridCard
      title={achievement.title}
      imageUrl={achievement.coverUrl}
      activeOpacity={clickable ? 0.85 : 1}
      onPress={clickable ? onPress : undefined}
      overlay={
        <>
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
        </>
      }
      footer={
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
      }
    />
  );
}
