import React, { useEffect, useState } from 'react';
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
import { BottomSheet } from '@shared/ui/BottomSheet';
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
import type { Task } from '@entities/task';
import { useUpdateTask } from '@entities/task';

interface Props {
  task: Task | null;
  onClose: () => void;
}

/**
 * Редактирование основных полей задания: название, описание, категория, баллы,
 * срок. Обложку и архивирование вынесли отдельно — здесь только то, что admin
 * правит чаще всего.
 */
export function EditTaskSheet({ task, onClose }: Props): React.ReactElement | null {
  const update = useUpdateTask();
  const toast = useToast();
  const alert = useAlert();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [points, setPoints] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Управление обложкой:
  //  - coverUri/coverMime/coverName заполнены → выбран новый файл, нужно
  //    загрузить и проставить taskFileId;
  //  - coverRemoved=true → пользователь явно снёс обложку, шлём taskFileId=null;
  //  - всё пусто и coverRemoved=false → обложку не трогаем, поле не отправляем.
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverMime, setCoverMime] = useState<string | null>(null);
  const [coverName, setCoverName] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setPoints(String(task.points));
    setExpiresAt(task.expiresAt);
    setError('');
    setCoverUri(null);
    setCoverMime(null);
    setCoverName(null);
    setCoverRemoved(false);
  }, [task]);

  if (!task) return null;

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

  // Что показать пользователю в превью обложки:
  //  - новый выбранный файл, если есть;
  //  - текущая обложка задания, если она была и не удалена;
  //  - иначе плейсхолдер.
  const previewUri = coverUri ?? (coverRemoved ? null : task.coverUrl);

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) {
      setError('Название не может быть пустым');
      return;
    }
    if (!description.trim()) {
      setError('Описание не может быть пустым');
      return;
    }
    const pts = Number.parseInt(points, 10);
    if (Number.isNaN(pts) || pts <= 0) {
      setError('Баллы — положительное число');
      return;
    }
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      setError('Дедлайн должен быть в будущем');
      return;
    }

    setSubmitting(true);
    try {
      // taskFileId:
      //  undefined → не трогаем обложку;
      //  string    → выбран новый файл (после загрузки получим id);
      //  null      → пользователь явно убрал обложку.
      let taskFileId: string | null | undefined;
      if (coverUri && coverMime && coverName) {
        const uploaded = await filesApi.upload({
          uri: coverUri,
          name: coverName,
          mimeType: coverMime,
          type: 'task',
        });
        taskFileId = uploaded.id;
      } else if (coverRemoved) {
        taskFileId = null;
      }

      await update.mutateAsync({
        id: task.id,
        dto: {
          title: title.trim(),
          description: description.trim(),
          category,
          points: pts,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          ...(taskFileId !== undefined ? { taskFileId } : {}),
        },
      });
      toast.show('Задание обновлено', 'success');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Не удалось обновить'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      title="Редактирование задания"
      onClose={onClose}
      maxHeightRatio={0.9}
    >
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
                label="Описание"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="h-24"
              />

              <Text className="text-sm font-medium text-text-primary mb-2">
                Категория
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {TASK_CATEGORIES.map((categoryOption) => {
                  const selected = category === categoryOption;
                  return (
                    <TouchableOpacity
                      key={categoryOption}
                      onPress={() => setCategory(categoryOption)}
                      activeOpacity={0.7}
                      className={`px-4 py-2 rounded-xl border ${
                        selected
                          ? 'bg-primary border-primary'
                          : 'bg-surface border-border'
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
                Обложка задания{' '}
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
                {!coverUri && !coverRemoved && task.coverUrl ? (
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
    </BottomSheet>
  );
}
