import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } } | null)?.response
          ?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      staleTime: 60 * 1000,
      // Кэш не выкидываем, пока приложение в памяти — иначе persistence теряет
      // смысл (GC может выкинуть данные раньше, чем persister их сериализует).
      // Срок жизни на диске ограничен maxAge в PersistQueryClientProvider.
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
