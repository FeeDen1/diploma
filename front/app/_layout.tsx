import '../global.css';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { focusManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@shared/api/query-client';
import { setUnauthorizedHandler } from '@shared/api';
import { ThemeProvider, useTheme } from '@shared/theme';
import { DialogProvider, ToastProvider } from '@shared/ui';
import { storage } from '@shared/lib/storage';
import { useAutoUpdate } from '@shared/lib/useAutoUpdate';
import {
  usePushTokenSync,
  useNotificationRouting,
} from '@features/push-notifications';

/**
 * Удерживаем нативный splash-screen на ROOT-уровне, до того как expo-router
 * успел смонтировать `<Stack />` и любые экраны под ним.
 *
 * preventAutoHideAsync вызывается на module-level (не в useEffect), чтобы
 * сработать строго до первого render — иначе expo-router успевает за один кадр
 * показать любой initial route, прежде чем мы заблокируем splash.
 */
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * Куда вести пользователя после bootstrap. Список фиксирован, других путей нет.
 */
type BootstrapTarget =
  | '/(onboarding)/welcome'
  | '/(auth)/login'
  | '/(onboarding)/setup'
  | '/(tabs)/achievements';

/**
 * Контекст с уже принятым решением о маршруте. `null` означает «решение ещё
 * вычисляется», в этот момент splash должен быть виден, а Stack не смонтирован.
 *
 * Этот контекст читается в `app/index.tsx` для рендера <Redirect />.
 */
const BootstrapTargetContext = createContext<BootstrapTarget | null>(null);

export function useBootstrapTarget(): BootstrapTarget {
  const ctx = useContext(BootstrapTargetContext);
  if (ctx === null) {
    throw new Error(
      'useBootstrapTarget вызван до того как RootLayout определил target',
    );
  }
  return ctx;
}

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

/**
 * Bootstrap — асинхронно решает на основе локального состояния (SecureStore),
 * на какой экран должен попасть пользователь после splash. Не дёргает бэк
 * специально: см. комментарий ниже про оффлайн.
 */
async function decideBootstrapTarget(): Promise<BootstrapTarget> {
  const onboardingDone = await storage.isOnboardingCompleted();
  if (!onboardingDone) return '/(onboarding)/welcome';

  const accessToken = await storage.getAccessToken();
  if (!accessToken) return '/(auth)/login';

  // Намеренно НЕ дёргаем getMe() — иначе оффлайн-юзер был бы выкинут на login
  // из-за network error. Валидность токена проверит axios-interceptor когда
  // реальные запросы пойдут (см. setUnauthorizedHandler ниже).

  const profileDone = await storage.isProfileSetupCompleted();
  if (!profileDone) return '/(onboarding)/setup';

  return '/(tabs)/achievements';
}

export default function RootLayout(): React.ReactElement | null {
  // target = null → ничего не рендерим, нативный splash всё ещё виден.
  // Только после того как target вычислен, монтируем Stack — и в этот же
  // момент IndexScreen через useBootstrapTarget делает <Redirect />.
  const [target, setTarget] = useState<BootstrapTarget | null>(null);

  // Забираем OTA-обновление сразу при старте, не дожидаясь второго запуска.
  useAutoUpdate();

  // bootstrap-эффект: один раз при первом mount.
  useEffect(() => {
    let mounted = true;
    decideBootstrapTarget()
      .then((next) => {
        if (mounted) setTarget(next);
      })
      .catch(() => {
        if (mounted) setTarget('/(auth)/login');
      });
    return () => {
      mounted = false;
    };
  }, []);

  // ВАЖНО: hideAsync вызывается ПОСЛЕ того как Stack уже отрендерен
  // (target !== null), и через два requestAnimationFrame — это даёт
  // expo-router время:
  //   1) смонтировать Stack
  //   2) IndexScreen применил <Redirect href={target} />
  //   3) Stack коммитит navigate на target route
  //   4) target route успел отрендериться первым кадром
  // Если hide делать раньше (в .finally bootstrap), нативный splash
  // гаснет в момент mounting Stack — и на 1-2 кадра виден initial route,
  // что и давало мелькание онбординга.
  useEffect(() => {
    if (target === null) return;
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        void SplashScreen.hideAsync().catch(() => undefined);
      });
      cleanupId = id2;
    });
    let cleanupId = id1;
    return () => cancelAnimationFrame(cleanupId);
  }, [target]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      router.replace('/(auth)/login');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // React Query в React Native сам не знает о «фокусе окна» — пробрасываем
  // AppState, чтобы refetchOnWindowFocus-запросы (лента заданий) обновлялись
  // при каждом возврате приложения из фона.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
    });
    return () => subscription.remove();
  }, []);

  // Главный фикс «мерцания»: пока target=null, ничего не рендерим — значит
  // никакой Stack/экран не существует в дереве, expo-router физически не может
  // показать «промежуточный» онбординг или login. На экране ровно нативный
  // splash, без единого React-компонента поверх.
  if (target === null) return null;

  return (
    <BootstrapTargetContext.Provider value={target}>
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
                <Stack
                  initialRouteName="index"
                  screenOptions={{
                    headerShown: false,
                    animation: 'none',
                  }}
                />
              </DialogProvider>
            </ToastProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </BootstrapTargetContext.Provider>
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
