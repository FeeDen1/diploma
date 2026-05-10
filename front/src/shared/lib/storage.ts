import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Хранилище приложения. Разделено по чувствительности данных:
 *
 *   SecureStore — для секретов: access/refresh JWT-токены. Шифруется через
 *     Android Keystore / iOS Keychain. Переживает переустановку приложения
 *     с тем же bundleId — это нормально для токенов, но плохо для UX-флагов
 *     типа «онбординг показан»: пользователь, удаливший и переустановивший
 *     приложение, ожидает увидеть онбординг заново.
 *
 *   AsyncStorage — для UX-флагов и предпочтений (тема, статус онбординга,
 *     профиль настроен). Очищается при удалении приложения и при «Очистить
 *     данные» в настройках Android — это правильное поведение для не-секретных
 *     данных, привязанных к конкретной установке.
 */

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PROFILE_SETUP_COMPLETED: 'profile_setup_completed',
  THEME_MODE: 'theme_mode',
} as const;

export type StoredThemeMode = 'light' | 'dark';

export const storage = {
  // ── Токены: SecureStore (нужно шифрование) ────────────────────────────────
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
  },

  async setTokens(access: string, refresh: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, access),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refresh),
    ]);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    ]);
  },

  // ── UX-флаги: AsyncStorage (без шифрования, очищается с приложением) ──────
  async isOnboardingCompleted(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETED);
    return value === 'true';
  },

  async setOnboardingCompleted(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETED, 'true');
  },

  async isProfileSetupCompleted(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.PROFILE_SETUP_COMPLETED);
    return value === 'true';
  },

  async setProfileSetupCompleted(): Promise<void> {
    await AsyncStorage.setItem(KEYS.PROFILE_SETUP_COMPLETED, 'true');
  },

  async getThemeMode(): Promise<StoredThemeMode | null> {
    const raw = await AsyncStorage.getItem(KEYS.THEME_MODE);
    return raw === 'light' || raw === 'dark' ? raw : null;
  },

  async setThemeMode(mode: StoredThemeMode): Promise<void> {
    await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(KEYS.ONBOARDING_COMPLETED),
      AsyncStorage.removeItem(KEYS.PROFILE_SETUP_COMPLETED),
      AsyncStorage.removeItem(KEYS.THEME_MODE),
    ]);
  },
};
