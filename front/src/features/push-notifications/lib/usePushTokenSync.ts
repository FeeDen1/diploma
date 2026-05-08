import { useEffect, useRef } from 'react';
import { useMe } from '../../../entities/user';
import {
  registerDeviceToken,
  unregisterDeviceToken,
} from './registerDeviceToken';

/**
 * Синхронизирует Expo Push Token с бэком в зависимости от состояния
 * аутентификации:
 *  - залогинен → регистрируем токен (один раз за «сессию» юзера)
 *  - разлогинен → удаляем зарегистрированный ранее токен
 *
 * Хук вешается один раз в корне приложения.
 */
export function usePushTokenSync(): void {
  const { data: me } = useMe();
  const userIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = me?.id ?? null;

    // Юзер не менялся — ничего не делаем (избегаем повторного запроса
    // permission, повторной регистрации и т.п.).
    if (userIdRef.current === currentUserId) return;

    const previousUserId = userIdRef.current;
    const previousToken = tokenRef.current;
    userIdRef.current = currentUserId;

    // Logout: был юзер, стал null → отзываем токен на бэке.
    if (previousUserId && !currentUserId && previousToken) {
      tokenRef.current = null;
      void unregisterDeviceToken(previousToken);
      return;
    }

    // Login или первый запуск с активной сессией → регистрируем.
    if (currentUserId) {
      void registerDeviceToken().then((token) => {
        tokenRef.current = token;
      });
    }
  }, [me?.id]);
}
