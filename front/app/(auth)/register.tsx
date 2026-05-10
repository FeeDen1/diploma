import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RegisterForm } from '@features/auth';

export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <RegisterForm />
    </SafeAreaView>
  );
}

