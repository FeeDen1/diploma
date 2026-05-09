import React, { useEffect } from 'react';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { storage } from '../src/shared/lib/storage';
import { usersApi } from '../src/shared/api/users';

/**
 * Удерживаем нативный splash-screen, пока bootstrap-эффект не решит, на какой
 * экран вести пользователя. Без этого Expo по дефолту скрывает splash в момент
 * первого render `<Stack />`, и пока асинхронно читается SecureStore, успевают
 * мелькнуть промежуточные экраны (онбординг, индикатор) — отсюда «мерцание».
 *
 * preventAutoHideAsync синхронен по сигнатуре, но возвращает Promise; ошибку
 * глотаем намеренно: если splash уже скрыт системой, повторный preventAutoHide
 * на проде кидает warn — он нам бесполезен.
 */
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function IndexScreen(): null {
  useEffect(() => {
    let mounted = true;

    async function bootstrap(): Promise<void> {
      try {
        const onboardingDone = await storage.isOnboardingCompleted();
        if (!onboardingDone) {
          if (mounted) router.replace('/(onboarding)');
          return;
        }

        const accessToken = await storage.getAccessToken();
        if (!accessToken) {
          if (mounted) router.replace('/(auth)/login');
          return;
        }

        // Проверяем валидность токена + что профиль существует
        try {
          await usersApi.getMe();
        } catch {
          await storage.clearTokens();
          if (mounted) router.replace('/(auth)/login');
          return;
        }

        const profileDone = await storage.isProfileSetupCompleted();
        if (!profileDone) {
          if (mounted) router.replace('/(onboarding)/setup');
          return;
        }

        if (mounted) router.replace('/(tabs)/achievements');
      } catch {
        if (mounted) router.replace('/(auth)/login');
      } finally {
        // Скрываем splash только после того, как пункт назначения уже выбран
        // и router.replace отработал. Иначе пользователь увидит первый кадр
        // не того экрана. catch — на случай повторного вызова hideAsync.
        await SplashScreen.hideAsync().catch(() => undefined);
      }
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  // Ничего не рендерим: пока bootstrap идёт, на экране нативный splash
  // (см. resizeMode/backgroundColor в app.json), а после router.replace
  // этот компонент уже не виден — текущим становится целевой экран.
  return null;
}
