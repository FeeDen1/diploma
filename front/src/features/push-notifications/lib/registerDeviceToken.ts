import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { notificationsApi, type DevicePlatform } from '@shared/api/notifications';

/**
 * Получает Expo Push Token и регистрирует его на бэке.
 * Возвращает токен (нужен для unregister на logout) или null, если разрешение
 * не дано / устройство не физическое / запуск через Expo Go без projectId.
 */
export async function registerDeviceToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;

  if (!granted) {
    const ask = await Notifications.requestPermissionsAsync();
    granted = ask.granted;
  }
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

  let tokenResult;
  try {
    tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
  } catch {
    // В Expo Go без projectId токен всё равно выдаётся; ловим случаи когда
    // нативный модуль вернул ошибку (например на симуляторе).
    return null;
  }

  const token = tokenResult.data;
  const platform: DevicePlatform = Platform.OS === 'ios' ? 'ios' : 'android';

  try {
    await notificationsApi.registerDeviceToken({ token, platform });
  } catch {
    // Не блокируем UI логина из-за того, что бэк не принял токен.
    return null;
  }

  return token;
}

export async function unregisterDeviceToken(token: string): Promise<void> {
  try {
    await notificationsApi.unregisterDeviceToken({ token });
  } catch {
    // На logout уже неважно: токен в БД физически останется до DeviceNotRegistered.
  }
}
