import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { UploadedImage } from '@shared/ui/UploadedImage';
import { AlbumsIcon } from '@shared/ui/icons';
import { useToast } from '@shared/ui';
import { extractErrorMessage } from '@shared/api';
import { TASK_CATEGORY_LABELS } from '@shared/api/tasks';
import {
  useChangeSubmissionStatus,
  useSubmissionsByStudent,
  type Submission,
} from '@entities/submission';

interface Props {
  studentId: string;
}

const STATUS_BADGE = {
  pending: { text: 'На проверке', variant: 'warning' as const },
  approved: { text: 'Засчитано', variant: 'success' as const },
  rejected: { text: 'Отклонено', variant: 'error' as const },
};

/**
 * Виджет «все сдачи конкретного студента» — куратор открывает с экрана
 * студента в адаптер-флоу. Композирует entity Submission + действия
 * approve/reject.
 */
export function StudentSubmissionsList({
  studentId,
}: Props): React.ReactElement {
  const { data, isLoading, refetch } = useSubmissionsByStudent(studentId);
  const review = useChangeSubmissionStatus();
  const toast = useToast();

  const handleReview = (
    submission: Submission,
    status: 'approved' | 'rejected',
  ): void => {
    review.mutate(
      { id: submission.id, status },
      {
        onSuccess: () =>
          toast.show(
            status === 'approved' ? 'Засчитано' : 'Отклонено',
            status === 'approved' ? 'success' : 'info',
          ),
        onError: (err) => toast.show(extractErrorMessage(err), 'error'),
      },
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
            <View className="flex-row items-start mb-3">
              <View className="flex-1 mr-2">
                <Text
                  className="text-base font-semibold text-text-primary"
                  numberOfLines={2}
                >
                  {item.task.title}
                </Text>
                <Text className="text-xs text-text-secondary mt-1">
                  {TASK_CATEGORY_LABELS[item.task.category]} · +
                  {item.task.points}
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
                  disabled={review.isPending}
                />
                <Button
                  title="Засчитать"
                  onPress={() => handleReview(item, 'approved')}
                  className="flex-1"
                  loading={review.isPending}
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
          title="У студента нет сдач"
          description="Сдачи будут появляться здесь по мере того, как студент их отправляет"
        />
      }
    />
  );
}
