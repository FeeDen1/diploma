import { useEffect } from 'react';
import * as Updates from 'expo-updates';

/**
 * Применяет OTA-обновление сразу, а не со второго запуска.
 *
 * По умолчанию expo-updates (fallbackToCacheTimeout = 0) стартует приложение
 * на закешированной версии, качает новую в фоне и применяет её лишь при
 * СЛЕДУЮЩЕМ холодном старте. Для пользователя это выглядит как «обновление не
 * приехало»: он перезапустил приложение один раз и увидел старый код.
 *
 * Здесь при запуске проверяем апдейт, скачиваем и перезагружаем приложение,
 * если он есть. Зацикливания не будет: после reload новая версия уже активна,
 * и следующая проверка вернёт isAvailable = false.
 *
 * В dev (Metro/Expo Go) Updates.isEnabled = false — хук ничего не делает.
 */
export function useAutoUpdate(): void {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    let cancelled = false;

    void (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (cancelled || !check.isAvailable) return;

        await Updates.fetchUpdateAsync();
        if (cancelled) return;

        await Updates.reloadAsync();
      } catch {
        // Обновление некритично: нет сети или сервер недоступен — продолжаем
        // работать на текущей версии, expo-updates подхватит её позже сам.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
