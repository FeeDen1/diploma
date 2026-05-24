import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { useAlert, useToast } from '@shared/ui';
import { extractErrorMessage } from '@shared/api';
import { prepareImageForUpload } from '@shared/lib/prepare-image';
import { filesApi } from '@shared/api/files';
import { useCreateReward } from '@entities/reward';

export function AddRewardForm(): React.ReactElement {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const create = useCreateReward();
  const alert = useAlert();
  const toast = useToast();

  const pickImage = async (): Promise<void> => {
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
      setImageUri(prepared.uri);
      setImageMime(prepared.mimeType);
      setImageName(prepared.fileName);
    } catch {
      await alert({
        title: 'Не удалось обработать фото',
        message: 'Попробуйте другое изображение.',
        tone: 'danger',
      });
    }
  };

  const handleCreate = async (): Promise<void> => {
    if (!title.trim()) {
      setFormError('Введите название лота');
      return;
    }
    const priceNum = Number.parseInt(price, 10);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setFormError('Цена должна быть положительным числом');
      return;
    }
    setFormError('');

    setSubmitting(true);
    try {
      let imageFileId: string | undefined;
      if (imageUri && imageMime && imageName) {
        const file = await filesApi.upload({
          uri: imageUri,
          name: imageName,
          mimeType: imageMime,
          type: 'reward',
        });
        imageFileId = file.id;
      }

      await create.mutateAsync({
        title: title.trim(),
        price: priceNum,
        imageFileId,
      });

      toast.show('Лот добавлен в магазин', 'success');
      setTitle('');
      setPrice('');
      setImageUri(null);
      setImageMime(null);
      setImageName(null);
    } catch (err) {
      await alert({
        title: 'Не удалось создать лот',
        message: extractErrorMessage(err),
        tone: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="p-4"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-xl font-bold text-text-primary mb-4">
        Создать лот
      </Text>

      {formError ? (
        <View className="bg-error/10 rounded-xl p-3 mb-3">
          <Text className="text-sm text-error">{formError}</Text>
        </View>
      ) : null}

      <Input
        label="Название"
        placeholder="Худи, кружка, наклейка…"
        value={title}
        onChangeText={setTitle}
      />

      <Input
        label="Цена в баллах"
        placeholder="80"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <Text className="text-sm font-medium text-text-primary mb-2">
        Фотография (необязательно)
      </Text>
      <TouchableOpacity
        onPress={() => void pickImage()}
        activeOpacity={0.7}
        className="rounded-xl border border-border bg-surface mb-6 overflow-hidden"
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: 180 }}
            resizeMode="contain"
          />
        ) : (
          <View className="h-32 items-center justify-center">
            <Text className="text-base text-text-secondary">
              Нажми, чтобы выбрать фото
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Button
        title="Добавить в магазин"
        onPress={() => void handleCreate()}
        loading={submitting || create.isPending}
        fullWidth
      />
    </ScrollView>
  );
}
