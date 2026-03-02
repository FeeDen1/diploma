import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { DIRECTIONS, GROUPS_BY_DIRECTION, type Direction } from '../../../shared/config/api';
import { storage } from '../../../shared/lib/storage';
import { useAuthStore } from '../../../entities/user';
import { mockSetupProfile } from '../../../shared/api/mocks';

export function ProfileSetupForm() {
  const user = useAuthStore((s) => s.user);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [direction, setDirection] = useState<Direction | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableGroups = direction ? GROUPS_BY_DIRECTION[direction] : [];

  const handleDirectionSelect = (dir: Direction) => {
    setDirection(dir);
    setGroup(null);
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Введите имя и фамилию');
      return;
    }
    if (!direction) {
      setError('Выберите направление');
      return;
    }
    if (!group) {
      setError('Выберите группу');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const updatedUser = await mockSetupProfile(user?.id ?? '', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        direction,
        group,
      });
      useAuthStore.getState().setUser(updatedUser);
      useAuthStore.getState().setProfileSetupCompleted(true);
      await storage.setProfileSetupCompleted();
      router.replace('/(tabs)/achievements');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-textPrimary mb-2">
          Настройка профиля
        </Text>
        <Text className="text-base text-textSecondary mb-8">
          Заполните информацию о себе
        </Text>

        {error ? (
          <View className="bg-red-50 rounded-xl p-3 mb-4">
            <Text className="text-sm text-error">{error}</Text>
          </View>
        ) : null}

        <Input
          label="Имя"
          placeholder="Иван"
          value={firstName}
          onChangeText={setFirstName}
        />

        <Input
          label="Фамилия"
          placeholder="Петров"
          value={lastName}
          onChangeText={setLastName}
        />

        {/* Direction selection */}
        <Text className="text-sm font-medium text-textPrimary mb-2">
          Направление
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {DIRECTIONS.map((dir) => (
            <TouchableOpacity
              key={dir}
              onPress={() => handleDirectionSelect(dir)}
              activeOpacity={0.7}
              className={`
                px-5 py-3 rounded-xl border
                ${direction === dir ? 'bg-primary-600 border-primary-600' : 'bg-surface border-border'}
              `}
            >
              <Text
                className={`text-base font-medium ${
                  direction === dir ? 'text-white' : 'text-textPrimary'
                }`}
              >
                {dir}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Group selection */}
        {direction && (
          <>
            <Text className="text-sm font-medium text-textPrimary mb-2">
              Академическая группа
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-8">
              {availableGroups.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGroup(g)}
                  activeOpacity={0.7}
                  className={`
                    w-14 h-14 rounded-xl border items-center justify-center
                    ${group === g ? 'bg-primary-600 border-primary-600' : 'bg-surface border-border'}
                  `}
                >
                  <Text
                    className={`text-base font-medium ${
                      group === g ? 'text-white' : 'text-textPrimary'
                    }`}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Button
          title="Продолжить"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

