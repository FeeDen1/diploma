/**
 * Jest для Expo: используем jest-expo preset, который правильно настраивает
 * трансформацию через babel-preset-expo и предоставляет моки нативных модулей.
 *
 * Тесты пишем строго рядом с исходниками в src/, файлы *.test.ts(x).
 */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/src/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  // Большинство expo-* и react-native-* модулей публикуются в ESM —
  // нужно явно разрешить их трансформацию, иначе Jest падает на `export`.
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'jest-(expo|react-native)|' +
      '(@react-native|react-native)(-.*)?|' +
      'react-clone-referenced-element|@react-navigation|' +
      'expo|expo-.*|@expo|@expo/.*|' +
      'unimodules|@unimodules/.*|sentry-expo|native-base|' +
      'nativewind|react-native-css-interop' +
      ')/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};
