import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@shared/ui/Button';
import { CameraIcon, CloseIcon } from '@shared/ui/icons';
import { useToast } from '@shared/ui';
import { TASK_CATEGORY_LABELS } from '@shared/api/tasks';
import { extractErrorMessage } from '@shared/api';
import { prepareImageForUpload } from '@shared/lib/prepare-image';
import {
  formatDeadline,
  getDeadlineSeverity,
  type DeadlineSeverity,
} from '@shared/lib/date';
import {
  useCreateSubmission,
  useReplaceMySubmissionFile,
} from '@entities/submission';
import type { AchievementView } from '../lib/useAchievementsView';

const DEADLINE_TEXT_CLASS: Record<DeadlineSeverity, string> = {
  expired: 'text-error',
  soon: 'text-warning',
  normal: 'text-text-secondary',
};

interface Props {
  achievement: AchievementView | null;
  /** Если задан — открываемся в режиме перезаливки указанной сдачи. */
  resubmitId?: string;
  onClose: () => void;
}

interface Asset {
  uri: string;
  fileName: string;
  mimeType: string;
}

export function SubmitAchievementSheet({
  achievement,
  resubmitId,
  onClose,
}: Props): React.ReactElement | null {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [errorText, setErrorText] = useState('');
  const createSubmission = useCreateSubmission();
  const replaceFile = useReplaceMySubmissionFile();
  const toast = useToast();

  if (!achievement) return null;

  const isResubmit = !!resubmitId;
  const submitting = isResubmit ? replaceFile.isPending : createSubmission.isPending;

  const reset = (): void => {
    setAsset(null);
    setErrorText('');
  };

  const handleClose = (): void => {
    reset();
    onClose();
  };

  const pickImage = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorText('Нужен доступ к фотографиям. Включите его в настройках.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const prepared = await prepareImageForUpload(result.assets[0]);
      setAsset(prepared);
      setErrorText('');
    } catch {
      setErrorText('Не удалось обработать фото');
    }
  };

  const handleSubmit = (): void => {
    if (!asset) return;

    if (isResubmit && resubmitId) {
      replaceFile.mutate(
        {
          id: resubmitId,
          fileUri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        },
        {
          onSuccess: () => {
            toast.show('Сдача обновлена и отправлена на проверку', 'success');
            handleClose();
          },
          onError: (err) =>
            setErrorText(extractErrorMessage(err, 'Не удалось обновить')),
        },
      );
      return;
    }

    createSubmission.mutate(
      {
        taskId: achievement.id,
        fileUri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      },
      {
        onSuccess: () => {
          toast.show('Задание отправлено на проверку', 'success');
          handleClose();
        },
        onError: (err) =>
          setErrorText(extractErrorMessage(err, 'Не удалось отправить')),
      },
    );
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-surface rounded-t-3xl px-5 pt-4 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-lg font-bold text-text-primary flex-1 mr-3"
              numberOfLines={2}
            >
              {achievement.title}
            </Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <CloseIcon size={24} color="rgb(100 116 139)" />
            </TouchableOpacity>
          </View>

          {achievement.coverUrl ? (
            <Image
              source={{ uri: achievement.coverUrl }}
              style={{ width: '100%', height: 160, borderRadius: 16 }}
              resizeMode="contain"
            />
          ) : null}

          <Text
            className={`text-sm text-text-secondary ${achievement.coverUrl ? 'mt-4' : ''} mb-1`}
          >
            {TASK_CATEGORY_LABELS[achievement.category]} · +{achievement.points} баллов
          </Text>
          {achievement.expiresAt ? (
            <Text
              className={`text-sm font-medium mb-1 ${
                DEADLINE_TEXT_CLASS[getDeadlineSeverity(achievement.expiresAt)]
              }`}
            >
              {formatDeadline(achievement.expiresAt)}
            </Text>
          ) : null}
          <Text className="text-base text-text-primary mb-5">
            {achievement.description}
          </Text>

          {isResubmit ? (
            <View className="bg-warning/10 rounded-xl p-3 mb-3">
              <Text className="text-sm text-text-primary">
                Загрузите новое фото — сдача снова уйдёт на проверку.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => void pickImage()}
            activeOpacity={0.8}
            disabled={submitting}
            className="rounded-2xl border border-dashed border-border bg-surface-secondary overflow-hidden mb-4"
            style={{ height: 220 }}
          >
            {asset ? (
              <Image
                source={{ uri: asset.uri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <CameraIcon size={36} color="rgb(100 116 139)" />
                <Text className="text-sm text-text-secondary mt-2">
                  {isResubmit
                    ? 'Прикрепите новое фото'
                    : 'Прикрепите фото-доказательство'}
                </Text>
              </View>
            )}
            {submitting ? (
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <ActivityIndicator size="large" color="#fff" />
                <Text className="text-white mt-3">Загружаем...</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {errorText ? (
            <View className="bg-error/10 rounded-xl p-3 mb-3">
              <Text className="text-sm text-error">{errorText}</Text>
            </View>
          ) : null}

          <Button
            title={isResubmit ? 'Перезалить' : 'Отправить на проверку'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!asset || submitting}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}
