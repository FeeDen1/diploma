import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Avatar } from '@shared/ui/Avatar';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { UploadedImage } from '@shared/ui/UploadedImage';
import { AlbumsIcon } from '@shared/ui/icons';
import { extractErrorMessage } from '@shared/api';
import {
  useChangeSubmissionStatus,
  useSubmissionsByTask,
  type Submission,
} from '@entities/submission';

interface Props {
  taskId: string;
}

const STATUS_BADGE = {
  pending: { text: 'На проверке', variant: 'warning' as const },
  approved: { text: 'Засчитано', variant: 'success' as const },
  rejected: { text: 'Отклонено', variant: 'error' as const },
};

/**
 * Виджет списка сдач по конкретному заданию (для куратора). Композирует:
 *  - entity Submission (useSubmissionsByTask, useChangeSubmissionStatus)
 *  - shared/ui (Card, Badge, Button, Avatar)
 *
 * Каждая pending-сдача имеет действия approve/reject. На approved/rejected —
 * только просмотр.
 */
export function SubmissionsList({ taskId }: Props): React.ReactElement {
  const { data, isLoading, refetch } = useSubmissionsByTask(taskId);
  const review = useChangeSubmissionStatus();

  const handleReview = (
    submission: Submission,
    status: 'approved' | 'rejected',
  ): void => {
    review.mutate(
      { id: submission.id, status },
      { onError: (err) => alert(extractErrorMessage(err)) },
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="rgb(79 70 229)" />
      </View>
    );
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const status = STATUS_BADGE[item.status];
        return (
          <Card className="mb-3" variant="outlined">
            <View className="flex-row items-center mb-3">
              <Avatar
                uri={item.studentAvatarUrl}
                name={item.student.fullName}
                size="md"
              />
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-text-primary">
                  {item.student.fullName}
                </Text>
                <Text className="text-xs text-text-secondary">
                  {item.student.email}
                </Text>
              </View>
              <Badge text={status.text} variant={status.variant} />
            </View>

            {item.submissionFileUrl ? (
              <UploadedImage uri={item.submissionFileUrl} />
            ) : null}

            {item.status === 'pending' ? (
              <View className="flex-row gap-2 mt-3">
                <Button
                  title="Отклонить"
                  variant="outline"
                  onPress={() => handleReview(item, 'rejected')}
                  className="flex-1"
                />
                <Button
                  title="Засчитать"
                  onPress={() => handleReview(item, 'approved')}
                  className="flex-1"
                />
              </View>
            ) : null}
          </Card>
        );
      }}
      contentContainerClassName="px-4 pb-4"
      showsVerticalScrollIndicator={false}
      refreshing={isLoading}
      onRefresh={refetch}
      ListEmptyComponent={
        <EmptyState
          Icon={AlbumsIcon}
          title="Нет сдач"
          description="Сдачи студентов на это задание появятся здесь"
        />
      }
    />
  );
}
