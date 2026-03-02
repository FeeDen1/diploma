import React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../shared/ui/Button';
import { UserStats } from '../../entities/user';
import { ProfileHeader, UserProgress, useProfile } from '../../features/profile';
import { authApi } from '../../features/auth';

export function ProfilePage() {
  const { data, isLoading } = useProfile();

  const handleLogout = async () => {
    await authApi.logout();
    router.replace('/(auth)/login');
  };

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeader user={data.user} />

      <View className="px-4 mb-4">
        <UserStats
          totalPoints={data.user.totalPoints}
          completedAchievements={data.completedAchievements}
          totalAchievements={data.totalAchievements}
        />
      </View>

      <UserProgress
        completed={data.completedAchievements}
        total={data.totalAchievements}
      />

      <View className="px-4 mt-6 mb-8">
        <Button
          title="Выйти"
          variant="outline"
          onPress={handleLogout}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

