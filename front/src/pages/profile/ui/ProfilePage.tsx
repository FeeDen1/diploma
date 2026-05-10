import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { useMe } from '@entities/user';
import { useMySubmissions } from '@entities/submission';
import { useTasksCount } from '@entities/task';
import { ProfileHeader, UserProgress } from '@features/profile';
import { ThemeToggle } from '@features/theme';
import { useLogout } from '@features/auth';
import { Stat } from './Stat';

/**
 * Страница профиля — композиционный экран. Сама не реализует UI-блоки,
 * а собирает их из features (ProfileHeader, UserProgress, ThemeToggle)
 * и локального Stat. Логика вычисления completedCount/totalTasks тоже
 * остаётся здесь, потому что она относится конкретно к экрану.
 */
export function ProfilePage(): React.ReactElement {
  const { data: user, isLoading } = useMe();
  const { data: submissions } = useMySubmissions();
  const { data: totalTasksCount } = useTasksCount();
  const logout = useLogout();

  const completedCount = useMemo(
    () => (submissions ?? []).filter((submission) => submission.status === 'approved').length,
    [submissions],
  );
  const totalTasks = totalTasksCount ?? 0;

  const handleLogout = (): void => {
    logout.mutate(undefined, {
      onSettled: () => router.replace('/(auth)/login'),
    });
  };

  if (isLoading || !user) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="rgb(79 70 229)" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeader user={user} />

      <View className="px-4 mb-4">
        <Card className="flex-row" variant="outlined">
          <Stat
            label="Доступно"
            value={user.availablePoints}
            hint={String(user.ratingTotal)}
          />
          <Stat label="Засчитано" value={completedCount} />
          <Stat label="Заданий" value={totalTasks} />
        </Card>
      </View>

      <UserProgress completed={completedCount} total={totalTasks} />

      <View className="px-4 mt-6">
        <Button
          title="Мои сдачи"
          variant="secondary"
          onPress={() => router.push('/my-submissions')}
          fullWidth
        />
      </View>

      <View className="px-4 mt-3">
        <Button
          title="Мои заказы"
          variant="secondary"
          onPress={() => router.push('/my-orders')}
          fullWidth
        />
      </View>

      <View className="px-4 mt-3">
        <ThemeToggle />
      </View>

      <View className="px-4 mt-6 mb-8">
        <Button
          title="Выйти"
          variant="outline"
          onPress={handleLogout}
          loading={logout.isPending}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}
