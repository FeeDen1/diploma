import { useMemo } from 'react';
import { TOKENS_BY_MODE } from '../tokens';
import { useThemeContext } from '../model/themeContext';

/**
 * Возвращает RGB-строки текущей темы. Используется там, где не работает
 * NativeWind className (нативные опции навигации, статус-бар, прямые JS-стили).
 */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  success: string;
  warning: string;
  error: string;
}

const tokenToRgb = (value: string): string => `rgb(${value})`;

export function useThemeColors(): ThemeColors {
  const { mode } = useThemeContext();
  return useMemo<ThemeColors>(() => {
    const tokens = TOKENS_BY_MODE[mode];
    return {
      background: tokenToRgb(tokens['--color-background']),
      surface: tokenToRgb(tokens['--color-surface']),
      surfaceSecondary: tokenToRgb(tokens['--color-surface-secondary']),
      border: tokenToRgb(tokens['--color-border']),
      textPrimary: tokenToRgb(tokens['--color-text-primary']),
      textSecondary: tokenToRgb(tokens['--color-text-secondary']),
      textMuted: tokenToRgb(tokens['--color-text-muted']),
      primary: tokenToRgb(tokens['--color-primary']),
      primarySoft: tokenToRgb(tokens['--color-primary-soft']),
      success: tokenToRgb(tokens['--color-success']),
      warning: tokenToRgb(tokens['--color-warning']),
      error: tokenToRgb(tokens['--color-error']),
    };
  }, [mode]);
}
