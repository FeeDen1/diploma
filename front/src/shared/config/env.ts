import Constants from 'expo-constants';

interface AppEnv {
  apiBaseUrl: string;
}

interface ExpoExtra {
  apiBaseUrl?: string;
  apiPort?: string;
}

function readExtra(): ExpoExtra {
  const fromExpoConfig = Constants.expoConfig?.extra as ExpoExtra | undefined;
  if (fromExpoConfig) return fromExpoConfig;
  const fromManifest = (Constants.manifest2 as { extra?: ExpoExtra } | undefined)?.extra;
  return fromManifest ?? {};
}

/**
 * Возвращает IP-адрес, на котором работает Metro (твой ноут).
 * Это тот же хост, к которому подключается устройство для бандла,
 * поэтому через него точно достижим и бэк (если он слушает 0.0.0.0).
 */
function getMetroHost(): string | null {
  // Expo Go SDK 49+
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0] ?? null;

  // Старый формат manifest для Expo Go
  const expoGoConfig = (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } })
    .expoGoConfig;
  if (expoGoConfig?.debuggerHost) {
    return expoGoConfig.debuggerHost.split(':')[0] ?? null;
  }

  return null;
}

/**
 * Источники значений (по приоритету):
 *  1. EXPO_PUBLIC_API_BASE_URL — полный URL из .env (для prod/staging билдов).
 *  2. Авто: Metro-host + EXPO_PUBLIC_API_PORT (или extra.apiPort, или 5001).
 *     Это даёт автоматически рабочий URL и для симулятора (localhost),
 *     и для физического устройства в Wi-Fi (IP ноута).
 *  3. extra.apiBaseUrl из app.json.
 *  4. http://localhost:5001/api — крайний дефолт.
 */
function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicit && explicit.length > 0) return explicit;

  const port =
    process.env.EXPO_PUBLIC_API_PORT ?? readExtra().apiPort ?? '5001';

  const metroHost = getMetroHost();
  if (metroHost) return `http://${metroHost}:${port}/api`;

  const fromExtra = readExtra().apiBaseUrl;
  if (fromExtra && fromExtra.length > 0) return fromExtra;

  return `http://localhost:${port}/api`;
}

export const env: AppEnv = {
  apiBaseUrl: resolveApiBaseUrl(),
};
