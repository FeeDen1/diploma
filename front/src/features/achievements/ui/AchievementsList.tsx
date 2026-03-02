import React, { useState, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SearchBar } from '../../../shared/ui/SearchBar';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { AchievementCard } from '../../../entities/achievement';
import type { UserAchievement } from '../../../entities/achievement';
import type { AchievementType } from '../../../shared/config/api';
import { AchievementFilters } from './AchievementFilters';
import { useAchievements, useSubmitAchievement } from '../api/achievementsApi';

export function AchievementsList() {
  const { data: achievements, isLoading, refetch } = useAchievements();
  const submitMutation = useSubmitAchievement();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<AchievementType | null>(null);

  const filtered = useMemo(() => {
    if (!achievements) return [];
    let list = achievements;

    if (selectedType) {
      list = list.filter((a) => a.type === selectedType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [achievements, selectedType, search]);

  const handleAchievementPress = async (achievement: UserAchievement) => {
    if (achievement.status !== 'available') return;

    Alert.alert(
      achievement.title,
      `${achievement.description}\n\n+${achievement.points} баллов\n\nПрикрепите фото для подтверждения`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выбрать фото',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              submitMutation.mutate({
                achievementId: achievement.id,
                photoUri: result.assets[0].uri,
              });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-2">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Поиск достижений..." />
      </View>

      <AchievementFilters
        selectedType={selectedType}
        onSelectType={setSelectedType}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AchievementCard
            achievement={item}
            onPress={() => handleAchievementPress(item)}
          />
        )}
        contentContainerClassName="px-4 pb-4"
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            title="Достижений не найдено"
            description="Попробуйте изменить фильтры"
          />
        }
      />
    </View>
  );
}

