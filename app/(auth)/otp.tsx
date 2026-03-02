import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OtpForm } from '../../src/features/auth';

export default function OtpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <OtpForm />
    </SafeAreaView>
  );
}

