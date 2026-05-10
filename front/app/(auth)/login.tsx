import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from '@features/auth';

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <LoginForm />
    </SafeAreaView>
  );
}

