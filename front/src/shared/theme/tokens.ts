/**
 * Дизайн-токены: значения цветов хранятся в формате "R G B"
 * (без префикса rgb()), чтобы NativeWind мог использовать их в
 * `rgb(var(--color-*) / <alpha-value>)` через tailwind.config.js.
 */

export type ThemeMode = 'light' | 'dark';

export const lightTokens = {
  '--color-background': '248 250 252',
  '--color-surface': '255 255 255',
  '--color-surface-secondary': '241 245 249',
  '--color-border': '226 232 240',
  '--color-text-primary': '15 23 42',
  '--color-text-secondary': '100 116 139',
  '--color-text-muted': '148 163 184',
  '--color-primary': '79 70 229',
  '--color-primary-soft': '224 231 255',
  '--color-success': '34 197 94',
  '--color-warning': '234 179 8',
  '--color-error': '239 68 68',
} as const;

export const darkTokens = {
  '--color-background': '15 23 42',
  '--color-surface': '30 41 59',
  '--color-surface-secondary': '51 65 85',
  '--color-border': '51 65 85',
  '--color-text-primary': '241 245 249',
  '--color-text-secondary': '148 163 184',
  '--color-text-muted': '100 116 139',
  '--color-primary': '129 140 248',
  '--color-primary-soft': '49 46 129',
  '--color-success': '74 222 128',
  '--color-warning': '250 204 21',
  '--color-error': '248 113 113',
} as const;

export type ThemeTokens = Record<keyof typeof lightTokens, string>;

export const TOKENS_BY_MODE: Record<ThemeMode, ThemeTokens> = {
  light: lightTokens,
  dark: darkTokens,
};
