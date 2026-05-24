import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { ScreenHeader } from '@shared/ui/ScreenHeader';
import { AlbumsIcon } from '@shared/ui/icons';
import { useConfirm, useToast } from '@shared/ui';
import { extractErrorMessage } from '@shared/api';
import { prepareImageForUpload } from '@shared/lib/prepare-image';
import { TASK_CATEGORY_LABELS } from '@shared/api/tasks';
import * as ImagePicker from 'expo-image-picker';
import {
  useDeleteMySubmission,
  useMySubmissions,
  useReplaceMySubmissionFile,
  type MySubmission,
  type SubmissionStatus,
} from '@entities/submission';

const STATUS_BADGE: Record<
  SubmissionStatus,
  { text: string; variant: 'warning' | 'success' | 'error' }
> = {
  pending: { text: 'На проверке', variant: 'warning' },
  approved: { text: 'Засчитано', variant: 'success' },
  rejected: { text: 'Отклонено', variant: 'error' },
};

/**
 * Страница «Мои сдачи». Открывается из профиля. Отображает все сдачи студента,
 * позволяет удалить pending и перезалить rejected.
 *
 * Логика resubmit/delete локальна для страницы: она использует мутации из
 * entities, и не имеет смысла без контекста экрана (нет переиспользования
 * в виде общего feature-блока).
 */
export function MySubmissionsPage(): React.ReactElement {
  const { data, isLoading, refetch } = useMySubmissions();
  const deleteMutation = useDeleteMySubmission();
  const replaceFile = useReplaceMySubmissionFile();
  const toast = useToast();
  const confirm = useConfirm();

  const handleResubmit = async (submission: MySubmission): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show('Нужен доступ к фото', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const prepared = await prepareImageForUpload(result.assets[0]);
      replaceFile.mutate(
        {
          id: submission.id,
          fileUri: prepared.uri,
          fileName: prepared.fileName,
          mimeType: prepared.mimeType,
        },
        {
          onSuccess: () =>
            toast.show('Сдача перезалита и отправлена на проверку', 'success'),
          onError: (err) =>
            toast.show(extractErrorMessage(err, 'Не удалось обновить'), 'error'),
        },
      );
    } catch {
      toast.show('Не удалось обработать фото', 'error');
    }
  };

  const handleDelete = async (submission: MySubmission): Promise<void> => {
    const ok = await confirm({
      title: 'Удалить сдачу?',
      message: `«${submission.task.title}» — действие нельзя отменить.`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    deleteMutation.mutate(submission.id, {
      onSuccess: () => toast.show('Сдача удалена', 'info'),
      onError: (err) =>
        toast.show(extractErrorMessage(err, 'Не удалось удалить'), 'error'),
    });
  };

  const renderItem = ({ item }: { item: MySubmission }): React.ReactElement => {
    const badge = STATUS_BADGE[item.status];
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
              {TASK_CATEGORY_LABELS[item.task.category]} · +{item.task.points}
            </Text>
          </View>
          <Badge text={badge.text} variant={badge.variant} />
        </View>

        {item.submissionFileUrl ? (
          <Image
            source={{ uri: item.submissionFileUrl }}
            style={{ width: '100%', height: 180, borderRadius: 12 }}
            resizeMode="contain"
          />
        ) : null}

        {item.status === 'pending' ? (
          <Button
            title="Удалить"
            variant="outline"
            onPress={() => void handleDelete(item)}
            className="mt-3"
            fullWidth
          />
        ) : null}

        {item.status === 'rejected' ? (
          <Button
            title="Перезалить фото"
            onPress={() => void handleResubmit(item)}
            loading={replaceFile.isPending}
            className="mt-3"
            fullWidth
          />
        ) : null}
      </Card>
    );
  };

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
      <ScreenHeader title="Мои сдачи" />

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
            Icon={AlbumsIcon}
            title="Пока нет сдач"
            description="Откройте раздел «Задания» и отправьте свою первую сдачу"
          />
        }
      />
    </SafeAreaView>
  );
}
