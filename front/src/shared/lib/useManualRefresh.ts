import { useCallback, useState } from 'react';

/**
 * Разводит pull-to-refresh и фоновые рефетчи react-query.
 *
 * Если завязать `refreshing` у FlatList на `isRefetching`, спиннер
 * RefreshControl вспыхивает на КАЖДУЮ инвалидацию (после покупки лота,
 * архивации и т.п.) и толкает список — экран «дёргается». Здесь спиннер
 * показывается только когда пользователь сам потянул список.
 */
export function useManualRefresh(refetch: () => Promise<unknown>): {
  refreshing: boolean;
  onRefresh: () => void;
} {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.resolve(refetch()).finally(() => setRefreshing(false));
  }, [refetch]);
  return { refreshing, onRefresh };
}
