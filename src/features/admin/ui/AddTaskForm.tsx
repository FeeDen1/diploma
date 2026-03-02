import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { ACHIEVEMENT_TYPES, type AchievementType } from '../../../shared/config/api';
import { useCreateAchievement } from '../api/adminApi';

export function AddTaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AchievementType>(ACHIEVEMENT_TYPES[0]);
  const [points, setPoints] = useState('');

  const createMutation = useCreateAchievement();

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Введите название задания');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Ошибка', 'Введите описание задания');
      return;
    }
    const pts = parseInt(points, 10);
    if (isNaN(pts) || pts <= 0) {
      Alert.alert('Ошибка', 'Введите корректное количество баллов');
      return;
    }

    createMutation.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        type,
        points: pts,
        imageUrl: null,
      },
      {
        onSuccess: () => {
          Alert.alert('Успешно', 'Задание создано');
          setTitle('');
          setDescription('');
          setPoints('');
          setType(ACHIEVEMENT_TYPES[0]);
        },
        onError: () => {
          Alert.alert('Ошибка', 'Не удалось создать задание');
        },
      }
    );
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="p-4"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-xl font-bold text-textPrimary mb-4">
        Создать задание
      </Text>

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

      <Text className="text-sm font-medium text-textPrimary mb-2">Тип</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {ACHIEVEMENT_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setType(t)}
            activeOpacity={0.7}
            className={`px-4 py-2 rounded-xl border ${
              type === t
                ? 'bg-primary-600 border-primary-600'
                : 'bg-surface border-border'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                type === t ? 'text-white' : 'text-textPrimary'
              }`}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Баллы"
        placeholder="100"
        value={points}
        onChangeText={setPoints}
        keyboardType="numeric"
      />

      <Button
        title="Создать"
        onPress={handleCreate}
        loading={createMutation.isPending}
        fullWidth
      />
    </ScrollView>
  );
}

