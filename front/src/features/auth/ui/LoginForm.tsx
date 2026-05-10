import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { extractErrorMessage } from '@shared/api';
import { loginSchema, type LoginFormData } from '../model/authSchema';
import { useLogin } from '../lib/useAuth';

export function LoginForm(): React.ReactElement {
  const [form, setForm] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [apiError, setApiError] = useState('');
  const login = useLogin();

  const handleSubmit = (): void => {
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    login.mutate(parsed.data, {
      onSuccess: (result) => {
        setApiError('');
        if (result.kind === 'otp-pending') {
          router.replace({
            pathname: '/(auth)/otp',
            params: { email: result.email },
          });
          return;
        }
        if (result.route === 'tabs') {
          router.replace('/(tabs)/achievements');
        } else {
          router.replace('/(onboarding)/setup');
        }
      },
      onError: (error) => setApiError(extractErrorMessage(error, 'Ошибка входа')),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 40,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="text-3xl font-bold text-text-primary mb-2">Вход</Text>
          <Text className="text-base text-text-secondary mb-8">
            Используйте университетскую почту
          </Text>

          {apiError ? (
            <View className="bg-error/10 rounded-xl p-3 mb-4">
              <Text className="text-sm text-error">{apiError}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            placeholder="st000000@student.spbu.ru"
            value={form.email}
            onChangeText={(email) => setForm((prev) => ({ ...prev, email }))}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />

          <Input
            label="Пароль"
            placeholder="Минимум 8 символов"
            value={form.password}
            onChangeText={(password) => setForm((prev) => ({ ...prev, password }))}
            error={errors.password}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="password"
          />

          <Button
            title="Войти"
            onPress={handleSubmit}
            loading={login.isPending}
            fullWidth
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            className="mt-4 items-center"
          >
            <Text className="text-sm text-primary font-medium">
              Нет аккаунта? Зарегистрироваться
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
