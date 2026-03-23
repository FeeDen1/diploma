import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { CloseIcon } from '../../../shared/ui/icons';
import { DateTimeField } from '../../../shared/ui/DateTimeField';
import { useToast } from '../../../shared/ui';
import { extractErrorMessage } from '../../../shared/api';
import {
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  type TaskCategory,
} from '../../../shared/api/tasks';
import type { Task } from '../../../entities/task';
import { useUpdateTask } from '../../../entities/task';

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('adaptation');
  const [points, setPoints] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setPoints(String(task.points));
    setExpiresAt(task.expiresAt);
    setError('');
  }, [task]);

  if (!task) return null;

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

    try {
      await update.mutateAsync({
        id: task.id,
        dto: {
          title: title.trim(),
          description: description.trim(),
          category,
          points: pts,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
        },
      });
      toast.show('Задание обновлено', 'success');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Не удалось обновить'));
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl pt-4 pb-8" style={{ maxHeight: '90%' }}>
            <View className="flex-row items-center justify-between px-5 mb-4">
              <Text className="text-lg font-bold text-text-primary flex-1 mr-3">
                Редактирование задания
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


              <Button
                title="Сохранить"
                onPress={() => {
                  void handleSave();
                }}
                loading={update.isPending}
                fullWidth
              />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
