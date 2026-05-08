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
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { extractErrorMessage } from '../../../shared/api';
import { registerSchema, type RegisterFormData } from '../model/authSchema';
import { useRegister } from '../lib/useAuth';

const initialForm: RegisterFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
};

export function RegisterForm(): React.ReactElement {
  const [form, setForm] = useState<RegisterFormData>(initialForm);
  const [errors, setErrors] =
    useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [apiError, setApiError] = useState('');
  const register = useRegister();

  const handleSubmit = (): void => {
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    const { confirmPassword: _confirm, ...payload } = parsed.data;
    register.mutate(payload, {
      onSuccess: ({ email }) => {
        setApiError('');
        router.replace({ pathname: '/(auth)/otp', params: { email } });
      },
      onError: (error) =>
        setApiError(extractErrorMessage(error, 'Ошибка регистрации')),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 40,
          paddingBottom: 200,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-text-primary mb-2">
          Регистрация
        </Text>
        <Text className="text-base text-text-secondary mb-8">
          Создайте аккаунт с университетской почтой
        </Text>

        {apiError ? (
          <View className="bg-error/10 rounded-xl p-3 mb-4">
            <Text className="text-sm text-error">{apiError}</Text>
          </View>
        ) : null}

        <Input
          label="Имя"
          placeholder="Иван"
          value={form.firstName}
          onChangeText={(firstName) => setForm((prev) => ({ ...prev, firstName }))}
          error={errors.firstName}
        />

        <Input
          label="Фамилия"
          placeholder="Петров"
          value={form.lastName}
          onChangeText={(lastName) => setForm((prev) => ({ ...prev, lastName }))}
          error={errors.lastName}
        />

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
          placeholder="Минимум 8 символов"
          value={form.password}
          onChangeText={(password) => setForm((prev) => ({ ...prev, password }))}
          error={errors.password}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          textContentType="oneTimeCode"
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
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          textContentType="oneTimeCode"
        />

        <Button
          title="Зарегистрироваться"
          onPress={handleSubmit}
          loading={register.isPending}
          fullWidth
        />

        <TouchableOpacity onPress={() => router.back()} className="mt-4 items-center">
          <Text className="text-sm text-primary font-medium">
            Уже есть аккаунт? Войти
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
