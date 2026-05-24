import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PROFILE_SETUP_COMPLETED: 'profile_setup_completed',
  THEME_MODE: 'theme_mode',
  // Expo Push Token текущего устройства. Храним, чтобы при logout отвязать
  // его от аккаунта на бэке ДО очистки JWT — иначе DELETE-запрос ушёл бы
  // без авторизации и push'и продолжали бы идти разлогиненному юзеру.
  PUSH_TOKEN: 'push_token',
} as const;

export type StoredThemeMode = 'light' | 'dark';

export const storage = {
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

  async isOnboardingCompleted(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(KEYS.ONBOARDING_COMPLETED);
    return value === 'true';
  },

  async setOnboardingCompleted(): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ONBOARDING_COMPLETED, 'true');
  },

  async isProfileSetupCompleted(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(KEYS.PROFILE_SETUP_COMPLETED);
    return value === 'true';
  },

  async setProfileSetupCompleted(): Promise<void> {
    await SecureStore.setItemAsync(KEYS.PROFILE_SETUP_COMPLETED, 'true');
  },

  async getPushToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.PUSH_TOKEN);
  },

  async setPushToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.PUSH_TOKEN, token);
  },

  async clearPushToken(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.PUSH_TOKEN);
  },

  async getThemeMode(): Promise<StoredThemeMode | null> {
    const raw = await SecureStore.getItemAsync(KEYS.THEME_MODE);
    return raw === 'light' || raw === 'dark' ? raw : null;
  },

  async setThemeMode(mode: StoredThemeMode): Promise<void> {
    await SecureStore.setItemAsync(KEYS.THEME_MODE, mode);
  },

  async clearAll(): Promise<void> {
    await Promise.all(
      Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)),
    );
  },
};
