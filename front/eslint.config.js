// Минимальный ESLint config для Expo + TS.
// Используем eslint-config-expo как базовый набор правил под React Native.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'jest.setup.js',
      'tailwind.config.js',
      'postcss.config.js',
    ],
  },
  {
    rules: {
      // Не цепляемся к not-null assertion, иногда оправдан в Expo-окружении
      '@typescript-eslint/no-non-null-assertion': 'off',
      // expo-router type-safety route hint
      'import/no-unresolved': 'off',
      // axios.create() / axios.isAxiosError — идиоматичный паттерн axios,
      // правило бросает шум на каждый его вызов
      'import/no-named-as-default-member': 'off',
      // Защита FSD-границ: путь через ../ к чужому слою — ошибка, должно
      // быть @shared / @entities / @features / @widgets / @pages.
      // Внутри одного slice (../ui/Button и т.п.) относительные импорты
      // остаются разрешены — regex требует именно перехода через слой.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex:
                '^(\\.\\./)+(src/)?(shared|entities|features|widgets|pages)/',
              message:
                'Используй FSD-алиас (@shared, @entities, @features, @widgets, @pages) вместо относительного пути через слой.',
            },
          ],
        },
      ],
    },
  },
];
