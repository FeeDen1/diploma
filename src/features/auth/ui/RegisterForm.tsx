import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { registerSchema, type RegisterFormData } from '../model/authSchema';
import { authApi } from '../api/authApi';

export function RegisterForm() {
  const [form, setForm] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleRegister = async () => {
    setApiError('');
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await authApi.register(form.email, form.password);
      router.push({ pathname: '/(auth)/otp', params: { email: form.email } });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Ошибка регистрации');
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
          Регистрация
        </Text>
        <Text className="text-base text-textSecondary mb-8">
          Создайте аккаунт с университетской почтой
        </Text>

        {apiError ? (
          <View className="bg-red-50 rounded-xl p-3 mb-4">
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
        />

        <Input
          label="Пароль"
          placeholder="Минимум 6 символов"
          value={form.password}
          onChangeText={(password) => setForm((prev) => ({ ...prev, password }))}
          error={errors.password}
          secureTextEntry
        />

        <Input
          label="Подтвердите пароль"
          placeholder="Повторите пароль"
          value={form.confirmPassword}
          onChangeText={(confirmPassword) =>
            setForm((prev) => ({ ...prev, confirmPassword }))
          }
          error={errors.confirmPassword}
          secureTextEntry
        />

        <Button
          title="Зарегистрироваться"
          onPress={handleRegister}
          loading={loading}
          fullWidth
        />

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 items-center"
        >
          <Text className="text-sm text-primary-600 font-medium">
            Уже есть аккаунт? Войти
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

