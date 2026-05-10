import { useEffect } from 'react';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { storage } from '@shared/lib/storage';

/**
 * preventAutoHideAsync вызывается в `app/_layout.tsx` — раньше любого экрана,
 * чтобы expo-router не успел отрисовать первый по алфавиту route до того как
 * SecureStore прочитан. Здесь же остаётся только hideAsync в finally — после
 * того как bootstrap решит, на какой экран вести пользователя.
 */

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

        // Намеренно НЕ дёргаем getMe() здесь:
        //
        //  1. Оффлайн: запрос упадёт с network error, и любая реакция в catch
        //     (clearTokens + redirect на login) будет ложным выкидыванием
        //     валидного юзера. PersistQueryClient рисует кеш из AsyncStorage —
        //     приложение должно открыться даже без сети.
        //  2. Онлайн с протухшим access-токеном: refresh подхватится в axios-
        //     interceptor (см. setUnauthorizedHandler в `app/_layout.tsx`),
        //     который сам редиректнет на login, если refresh тоже умер.
        //
        // Таким образом, наличие access-токена в SecureStore — единственный
        // признак «юзер залогинен». Валидность проверит бэк когда дойдут
        // запросы, а нам тут не нужно блокировать старт ради этой проверки.

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
