import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { storage } from '../src/shared/lib/storage';
import { usersApi } from '../src/shared/api/users';

export default function IndexScreen(): React.ReactElement {
  useEffect(() => {
    let mounted = true;

    async function bootstrap(): Promise<void> {
      try {
        const onboardingDone = await storage.isOnboardingCompleted();
        if (!onboardingDone) {
          if (mounted) router.replace('/(onboarding)');
          return;
        }

        const accessToken = await storage.getAccessToken();
        if (!accessToken) {
          if (mounted) router.replace('/(auth)/login');
          return;
        }

        // Проверяем валидность токена + что профиль существует
        try {
          await usersApi.getMe();
        } catch {
          await storage.clearTokens();
          if (mounted) router.replace('/(auth)/login');
          return;
        }

        const profileDone = await storage.isProfileSetupCompleted();
        if (!profileDone) {
          if (mounted) router.replace('/(onboarding)/setup');
          return;
        }

        if (mounted) router.replace('/(tabs)/achievements');
      } catch {
        if (mounted) router.replace('/(auth)/login');
      }
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="rgb(79 70 229)" />
    </View>
  );
}
