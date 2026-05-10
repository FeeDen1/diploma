import axios, {
  isAxiosError,
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '../config/env';
import { storage } from '../lib/storage';
import type { ApiErrorBody } from './types';

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// `_retry` — наш флаг, чтобы один и тот же запрос не зацикливался через refresh.
// `_hadToken` — был ли в исходном запросе Authorization-header. Различение
// «токен был и протух» vs «токена изначально не было» критично:
//   - первое = настоящая ре-аутентификация, нужно через refresh + редирект
//   - второе = юзер просто не залогинен, никакого редиректа делать нельзя
//     (иначе залогиненный onUnauthorizedHandler перебивает любую другую
//     навигацию в приложении — например, онбординг при первом запуске).
type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _hadToken?: boolean;
};

let onUnauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorizedHandler = handler;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
    (config as RetriableConfig)._hadToken = true;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<RefreshResponse>(
      `${env.apiBaseUrl}/auth/refresh`,
      { refreshToken },
    );
    await storage.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    await storage.clearTokens();
    return null;
  }
}

/**
 * Эндпоинты, где 401 — это бизнес-ошибка («неверный логин/пароль», «не тот код»),
 * а не «токен протух». Их не пытаемся ретраить через refresh и не редиректим
 * на /login — иначе пользователь, ошибившийся при логине, молча возвращается
 * на ту же страницу без сообщения об ошибке.
 */
const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/refresh',
];

function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    // На публичных auth-эндпоинтах 401 — нормальная ошибка валидации,
    // её просто отдаём вызывающему коду. Refresh здесь бессмыслен и
    // выкидывать пользователя на /login тоже нельзя.
    if (isPublicAuthRequest(original.url)) {
      return Promise.reject(error);
    }

    // Запрос изначально шёл БЕЗ токена — значит юзер просто не залогинен
    // (например, фоновый useMe() из PushNotificationsBridge на первом
    // запуске). Это НЕ «токен протух», refresh бессмыслен, и редирект на
    // login перебил бы любую активную навигацию (онбординг, например).
    // Молча отдаём 401 — компонент, который сделал запрос, его проигнорирует.
    if (!original._hadToken) {
      return Promise.reject(error);
    }

    original._retry = true;

    refreshPromise ??= performRefresh().finally(() => {
      refreshPromise = null;
    });

    const newToken = await refreshPromise;
    if (!newToken) {
      onUnauthorizedHandler?.();
      return Promise.reject(error);
    }

    original.headers.set('Authorization', `Bearer ${newToken}`);
    return apiClient.request(original as AxiosRequestConfig);
  },
);

export function extractErrorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function extractFieldErrors(error: unknown): Record<string, string[]> | null {
  if (isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.errors ?? null;
  }
  return null;
}
