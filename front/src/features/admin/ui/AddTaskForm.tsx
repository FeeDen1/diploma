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
import { DateTimeField } from '@shared/ui/DateTimeField';
import { useAlert, useToast } from '@shared/ui';
import { extractErrorMessage } from '@shared/api';
import { prepareImageForUpload } from '@shared/lib/prepare-image';
import { filesApi } from '@shared/api/files';
import {
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  type TaskCategory,
} from '@shared/api/tasks';
import { useCreateTask } from '@entities/task';

export function AddTaskForm(): React.ReactElement {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('adaptation');
  const [points, setPoints] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverMime, setCoverMime] = useState<string | null>(null);
  const [coverName, setCoverName] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const create = useCreateTask();
  const alert = useAlert();
  const toast = useToast();

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
      setFormError('Введите название задания');
      return;
    }
    if (!description.trim()) {
      setFormError('Введите описание задания');
      return;
    }
    const pts = Number.parseInt(points, 10);
    if (Number.isNaN(pts) || pts <= 0) {
      setFormError('Введите корректное количество баллов');
      return;
    }
    if (!coverUri || !coverMime || !coverName) {
      setFormError('Прикрепите обложку задания');
      return;
    }
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      setFormError('Дедлайн должен быть в будущем');
      return;
    }
    setFormError('');

    setSubmitting(true);
    try {
      const cover = await filesApi.upload({
        uri: coverUri,
        name: coverName,
        mimeType: coverMime,
        type: 'task',
      });

      await create.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        points: pts,
        taskFileId: cover.id,
        expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
      });

      toast.show('Задание создано', 'success');
      setTitle('');
      setDescription('');
      setPoints('');
      setCategory('adaptation');
      setCoverUri(null);
      setCoverMime(null);
      setCoverName(null);
      setExpiresAt(null);
    } catch (err) {
      await alert({
        title: 'Не удалось создать',
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
        Создать задание
      </Text>

      {formError ? (
        <View className="bg-error/10 rounded-xl p-3 mb-3">
          <Text className="text-sm text-error">{formError}</Text>
        </View>
      ) : null}

      <Input
        label="Название"
        placeholder="Название задания"
        value={title}
        onChangeText={setTitle}
      />

      <Input
        label="Описание"
        placeholder="Описание задания"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        className="h-24"
      />

      <Text className="text-sm font-medium text-text-primary mb-2">Категория</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {TASK_CATEGORIES.map((categoryOption) => {
          const selected = category === categoryOption;
          return (
            <TouchableOpacity
              key={categoryOption}
              onPress={() => setCategory(categoryOption)}
              activeOpacity={0.7}
              className={`px-4 py-2 rounded-xl border ${
                selected ? 'bg-primary border-primary' : 'bg-surface border-border'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selected ? 'text-white' : 'text-text-primary'
                }`}
              >
                {TASK_CATEGORY_LABELS[categoryOption]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Input
        label="Баллы"
        placeholder="10"
        value={points}
        onChangeText={setPoints}
        keyboardType="numeric"
      />

      <DateTimeField
        label="Срок выполнения"
        value={expiresAt}
        onChange={setExpiresAt}
        minimumDate={new Date()}
        clearable
        placeholder="Без срока (бессрочное)"
      />


      <Text className="text-sm font-medium text-text-primary mb-2">
        Обложка задания
      </Text>
      <TouchableOpacity
        onPress={() => void pickCover()}
        activeOpacity={0.7}
        className="rounded-xl border border-border bg-surface mb-6 overflow-hidden"
      >
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={{ width: '100%', height: 180 }}
            resizeMode="cover"
          />
        ) : (
          <View className="h-32 items-center justify-center">
            <Text className="text-base text-text-secondary">
              Нажми, чтобы выбрать картинку
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Button
        title="Создать"
        onPress={() => void handleCreate()}
        loading={submitting || create.isPending}
        fullWidth
      />
    </ScrollView>
  );
}
