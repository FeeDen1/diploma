/**
 * Глобальные моки и патчи для тестов фронта.
 *
 * NativeWind использует runtime-CSS-интероп, который тестам обычно не нужен —
 * проще считать, что className превращается в no-op в Jest.
 */

// expo-secure-store не работает в тестовом окружении — заглушка in-memory
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    getItemAsync: jest.fn((k) => Promise.resolve(store.get(k) ?? null)),
    setItemAsync: jest.fn((k, v) => {
      store.set(k, v);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((k) => {
      store.delete(k);
      return Promise.resolve();
    }),
  };
});

// expo-constants — нужен env.ts для apiBaseUrl
jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: '127.0.0.1:8081', extra: {} },
  manifest2: null,
  default: { expoConfig: { hostUri: '127.0.0.1:8081', extra: {} } },
}));

// react-native-reanimated — стандартный mock из библиотеки
jest.mock('react-native-reanimated', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-reanimated/mock'),
);
