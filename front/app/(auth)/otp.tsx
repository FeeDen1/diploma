import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { OtpForm } from '../../src/features/auth';

export default function OtpScreen(): React.ReactElement {
  const { email } = useLocalSearchParams<{ email?: string }>();

  if (!email) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-text-secondary text-center">
            Не удалось определить почту. Вернитесь и повторите вход.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <OtpForm email={email} />
    </SafeAreaView>
  );
}
