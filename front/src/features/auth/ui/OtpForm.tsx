import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { useToast } from '@shared/ui';
import { extractErrorMessage } from '@shared/api';
import { useResendOtp, useVerifyOtp } from '../lib/useAuth';

const RESEND_COOLDOWN = 60; // секунд

interface Props {
  email: string;
}

export function OtpForm({ email }: Props): React.ReactElement {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const verify = useVerifyOtp();
  const resend = useResendOtp();
  const toast = useToast();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Запускаем отсчёт сразу при открытии — код только что отправлен с бэка.
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSubmit = (): void => {
    if (code.length !== 6) {
      setError('Введите код из 6 цифр');
      return;
    }
    verify.mutate(
      { email, code },
      {
        onSuccess: ({ route }) => {
          setError('');
          router.replace(
            route === 'tabs' ? '/(tabs)/achievements' : '/(onboarding)/setup',
          );
        },
        onError: (err) => setError(extractErrorMessage(err, 'Неверный код')),
      },
    );
  };

  const handleResend = (): void => {
    if (secondsLeft > 0) return;
    resend.mutate(email, {
      onSuccess: () => {
        toast.show('Код отправлен повторно', 'success');
        setSecondsLeft(RESEND_COOLDOWN);
      },
      onError: (err) =>
        toast.show(extractErrorMessage(err, 'Не удалось отправить'), 'error'),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-text-primary mb-2">
          Подтверждение почты
        </Text>
        <Text className="text-base text-text-secondary mb-1">
          Мы отправили шестизначный код на
        </Text>
        <Text className="text-base font-semibold text-text-primary mb-8">
          {email}
        </Text>

        {error ? (
          <View className="bg-error/10 rounded-xl p-3 mb-4">
            <Text className="text-sm text-error">{error}</Text>
          </View>
        ) : null}

        <Input
          label="Код из письма"
          placeholder="123456"
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          error={error && code.length !== 6 ? error : undefined}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
        />

        <Button
          title="Подтвердить"
          onPress={handleSubmit}
          loading={verify.isPending}
          disabled={verify.isPending}
          fullWidth
        />

        <TouchableOpacity
          onPress={handleResend}
          activeOpacity={secondsLeft > 0 ? 1 : 0.7}
          disabled={secondsLeft > 0 || resend.isPending}
          className="mt-4 items-center"
        >
          <Text
            className={`text-sm font-medium ${
              secondsLeft > 0 ? 'text-text-muted' : 'text-primary'
            }`}
          >
            {secondsLeft > 0
              ? `Отправить ещё раз через ${secondsLeft} с`
              : resend.isPending
                ? 'Отправляем…'
                : 'Отправить ещё раз'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          className="mt-4 items-center"
        >
          <Text className="text-sm text-text-secondary">Назад ко входу</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
