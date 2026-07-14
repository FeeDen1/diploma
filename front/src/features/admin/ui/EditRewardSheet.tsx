import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { CloseIcon } from '@shared/ui/icons';
import { useAlert, useToast } from '@shared/ui';
import { extractErrorMessage } from '@shared/api';
import { prepareImageForUpload } from '@shared/lib/prepare-image';
import { filesApi } from '@shared/api/files';
import { useUpdateReward, type Reward } from '@entities/reward';

interface Props {
  reward: Reward | null;
  onClose: () => void;
}

/**
 * Редактирование лота магазина: название, цена, обложка. По структуре — как
 * EditTaskSheet, но полей меньше. Управление обложкой такое же:
 *  - выбран новый файл → загружаем и шлём imageFileId;
 *  - coverRemoved → шлём imageFileId=null (убрать обложку);
 *  - иначе поле не отправляем.
 */
export function EditRewardSheet({
  reward,
  onClose,
}: Props): React.ReactElement | null {
  const update = useUpdateReward();
  const toast = useToast();
  const alert = useAlert();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverMime, setCoverMime] = useState<string | null>(null);
  const [coverName, setCoverName] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);

  useEffect(() => {
    if (!reward) return;
    setTitle(reward.title);
    setPrice(String(reward.price));
    setError('');
    setCoverUri(null);
    setCoverMime(null);
    setCoverName(null);
    setCoverRemoved(false);
  }, [reward]);

  if (!reward) return null;

  const pickCover = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      await alert({
        title: 'Доступ к галерее',
        message: 'Разрешите доступ к фото в настройках.',
        tone: 'warning',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const prepared = await prepareImageForUpload(result.assets[0]);
      setCoverUri(prepared.uri);
      setCoverMime(prepared.mimeType);
      setCoverName(prepared.fileName);
      setCoverRemoved(false);
    } catch {
      await alert({
        title: 'Не удалось обработать фото',
        message: 'Попробуйте другое изображение.',
        tone: 'danger',
      });
    }
  };

  const clearPickedCover = (): void => {
    setCoverUri(null);
    setCoverMime(null);
    setCoverName(null);
  };

  const removeExistingCover = (): void => {
    clearPickedCover();
    setCoverRemoved(true);
  };

  const undoRemoveCover = (): void => {
    setCoverRemoved(false);
  };

  const previewUri = coverUri ?? (coverRemoved ? null : reward.imageUrl);

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) {
      setError('Название не может быть пустым');
      return;
    }
    const priceNum = Number.parseInt(price, 10);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError('Цена — положительное число');
      return;
    }

    setSubmitting(true);
    try {
      let imageFileId: string | null | undefined;
      if (coverUri && coverMime && coverName) {
        const uploaded = await filesApi.upload({
          uri: coverUri,
          name: coverName,
          mimeType: coverMime,
          type: 'reward',
        });
        imageFileId = uploaded.id;
      } else if (coverRemoved) {
        imageFileId = null;
      }

      await update.mutateAsync({
        id: reward.id,
        dto: {
          title: title.trim(),
          price: priceNum,
          ...(imageFileId !== undefined ? { imageFileId } : {}),
        },
      });
      toast.show('Лот обновлён', 'success');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Не удалось обновить'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className="bg-surface rounded-t-3xl pt-4 pb-8"
            style={{ maxHeight: '90%' }}
          >
            <View className="flex-row items-center justify-between px-5 mb-4">
              <Text className="text-lg font-bold text-text-primary flex-1 mr-3">
                Редактирование лота
              </Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <CloseIcon size={24} color="rgb(100 116 139)" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {error ? (
                <View className="bg-error/10 rounded-xl p-3 mb-3">
                  <Text className="text-sm text-error">{error}</Text>
                </View>
              ) : null}

              <Input label="Название" value={title} onChangeText={setTitle} />
              <Input
                label="Цена в баллах"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />

              <Text className="text-sm font-medium text-text-primary mb-2">
                Обложка{' '}
                <Text className="text-text-muted font-normal">
                  (необязательно)
                </Text>
              </Text>
              <TouchableOpacity
                onPress={() => void pickCover()}
                activeOpacity={0.7}
                className="rounded-xl border border-border bg-surface mb-3 overflow-hidden"
              >
                {previewUri ? (
                  <Image
                    source={{ uri: previewUri }}
                    style={{ width: '100%', height: 180 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-32 items-center justify-center">
                    <Text className="text-base text-text-secondary">
                      {coverRemoved
                        ? 'Обложка будет удалена'
                        : 'Нажми, чтобы добавить обложку'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View className="flex-row mb-6" style={{ gap: 16 }}>
                {coverUri ? (
                  <TouchableOpacity
                    onPress={clearPickedCover}
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm text-text-secondary font-medium">
                      Отменить замену
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {!coverUri && !coverRemoved && reward.imageUrl ? (
                  <TouchableOpacity
                    onPress={removeExistingCover}
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm text-error font-medium">
                      Удалить обложку
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {coverRemoved && !coverUri ? (
                  <TouchableOpacity
                    onPress={undoRemoveCover}
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm text-text-secondary font-medium">
                      Отменить удаление
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Button
                title="Сохранить"
                onPress={() => {
                  void handleSave();
                }}
                loading={submitting || update.isPending}
                fullWidth
              />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
