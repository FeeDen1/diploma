import React, { useState, useRef } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '../../../shared/ui/Button';
import { OTP_LENGTH } from '../../../shared/lib/constants';
import { authApi } from '../api/authApi';

export function OtpForm() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length !== OTP_LENGTH) {
      setError(`Введите ${OTP_LENGTH}-значный код`);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authApi.verifyOtp(email ?? '', otp);
      router.replace('/(onboarding)/setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-textPrimary mb-2">
          Подтверждение
        </Text>
        <Text className="text-base text-textSecondary mb-8">
          Введите код, отправленный на {email}
        </Text>

        {error ? (
          <View className="bg-red-50 rounded-xl p-3 mb-4">
            <Text className="text-sm text-error">{error}</Text>
          </View>
        ) : null}

        <View className="flex-row justify-center gap-3 mb-8">
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              className={`
                w-12 h-14 border-2 rounded-xl text-center text-xl font-bold text-textPrimary
                ${digit ? 'border-primary-500' : 'border-border'}
              `}
              value={digit}
              onChangeText={(text) => handleChange(text.slice(-1), index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          title="Подтвердить"
          onPress={handleVerify}
          loading={loading}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}

