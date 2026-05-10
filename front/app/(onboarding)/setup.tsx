import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileSetupForm } from '@features/onboarding';

export default function ProfileSetupScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ProfileSetupForm />
    </SafeAreaView>
  );
}

