import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { storage } from '@shared/lib/storage';

/**
 * Куда вести пользователя после bootstrap. `null` означает «решение ещё не
 * принято» — на это время рендерим null, нативный splash остаётся видимым.
 *
 * Список путей фиксирован, дальше только эти 4 направления:
 *   - /(onboarding)         — первый запуск, не пройден
 *   - /(auth)/login         — нет валидного access-токена
 *   - /(onboarding)/setup   — токен есть, но профиль не заполнен
 *   - /(tabs)/achievements  — обычный вход в приложение
 */
type BootstrapTarget =
  | '/(onboarding)'
  | '/(auth)/login'
  | '/(onboarding)/setup'
  | '/(tabs)/achievements';

/**
 * preventAutoHideAsync вызывается в `app/_layout.tsx` — раньше любого экрана,
 * чтобы expo-router не успел отрисовать первый по алфавиту route до того как
 * SecureStore прочитан. Здесь же только вычисляем целевой роут и снимаем splash.
 *
 * Принципиально используем компонент <Redirect /> от expo-router, а не
 * императивный router.replace в useEffect: Redirect делает переход на этапе
 * рендера и не запускает анимацию `<Stack>`, поэтому никаких промежуточных
 * экранов не успевает мелькнуть на пути от splash до целевого роута.
 */
export default function IndexScreen(): React.ReactElement | null {
  const [target, setTarget] = useState<BootstrapTarget | null>(null);

  useEffect(() => {
    let mounted = true;

    async function decide(): Promise<BootstrapTarget> {
      const onboardingDone = await storage.isOnboardingCompleted();
      if (!onboardingDone) return '/(onboarding)';

      const accessToken = await storage.getAccessToken();
      if (!accessToken) return '/(auth)/login';

      // Намеренно НЕ дёргаем getMe() — сценарий «оффлайн при старте» иначе
      // выкидывал бы юзера на login. Валидность токена проверит axios-
      // interceptor когда реальные запросы пойдут (см. setUnauthorizedHandler
      // в `app/_layout.tsx`).

      const profileDone = await storage.isProfileSetupCompleted();
      if (!profileDone) return '/(onboarding)/setup';

      return '/(tabs)/achievements';
    }

    decide()
      .then((next) => {
        if (mounted) setTarget(next);
      })
      .catch(() => {
        if (mounted) setTarget('/(auth)/login');
      })
      .finally(() => {
        // Скрываем splash после того, как target уже выставлен в state и
        // следующий рендер вернёт <Redirect />. Так нативный splash живёт до
        // самого момента появления целевого экрана.
        void SplashScreen.hideAsync().catch(() => undefined);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // target ещё не вычислен — рендерим ничего; splash виден.
  if (target === null) return null;

  // Декларативный редирект expo-router — без анимации, без промежуточных
  // экранов в стеке. Срабатывает синхронно при коммите.
  return <Redirect href={target} />;
}
