import '../global.css';
import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@shared/api/query-client';
import { setUnauthorizedHandler } from '@shared/api';
import { ThemeProvider, useTheme } from '@shared/theme';
import { DialogProvider, ToastProvider } from '@shared/ui';
import {
  usePushTokenSync,
  useNotificationRouting,
} from '@features/push-notifications';

/**
 * Persister TanStack Query для офлайн-режима: сериализует кэш в AsyncStorage,
 * чтобы при перезапуске приложения без интернета пользователь видел последние
 * данные (задания, баланс, лидерборд) вместо белых экранов.
 */
const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'pmtask-rq-cache',
  // throttle записи: не пишем в storage чаще раза в секунду
  throttleTime: 1000,
});

const PERSIST_OPTIONS = {
  persister: queryPersister,
  // Через 7 дней кэш считается устаревшим и при первом запуске сбрасывается.
  maxAge: 7 * 24 * 60 * 60 * 1000,
  // Если поменяется shape ответов API (новый ключ — новая «версия» кэша),
  // увеличиваем buster, чтобы старые сериализованные данные были отброшены.
  buster: 'v1',
};

export default function RootLayout(): React.ReactElement {
  useEffect(() => {
    setUnauthorizedHandler(() => {
      router.replace('/(auth)/login');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={PERSIST_OPTIONS}
      >
        <ThemeProvider>
          <ToastProvider>
            <DialogProvider>
              <ThemedStatusBar />
              <PushNotificationsBridge />
              <Stack screenOptions={{ headerShown: false }} />
            </DialogProvider>
          </ToastProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

/** Подсвечиваем статус-бар в нужный режим: светлая тема → тёмные иконки и наоборот. */
function ThemedStatusBar(): React.ReactElement {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

/**
 * Хуки push-уведомлений нужны внутри QueryClientProvider (usePushTokenSync
 * читает useMe), поэтому выделяем в отдельный компонент.
 */
function PushNotificationsBridge(): null {
  usePushTokenSync();
  useNotificationRouting();
  return null;
}
