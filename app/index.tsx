import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { storage } from '../src/shared/lib/storage';
import { useAuthStore } from '../src/entities/user';
import { authApi } from '../src/features/auth';

export default function IndexScreen() {
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const onboardingDone = await storage.isOnboardingCompleted();
        useAuthStore.getState().setOnboardingCompleted(onboardingDone);

        if (!onboardingDone) {
          if (mounted) router.replace('/(onboarding)');
          return;
        }

        const isAuth = await authApi.checkAuth();
        if (!isAuth) {
          if (mounted) router.replace('/(auth)/login');
          return;
        }

        const profileDone = await storage.isProfileSetupCompleted();
        useAuthStore.getState().setProfileSetupCompleted(profileDone);

        if (!profileDone) {
          if (mounted) router.replace('/(onboarding)/setup');
          return;
        }

        if (mounted) router.replace('/(tabs)/achievements');
      } catch {
        if (mounted) router.replace('/(auth)/login');
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}
