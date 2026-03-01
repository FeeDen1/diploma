import { useThemeContext } from '../model/themeContext';
import type { ThemeMode } from '../tokens';

export interface UseThemeReturn {
  mode: ThemeMode;
  isReady: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  isDark: boolean;
}

export function useTheme(): UseThemeReturn {
  const ctx = useThemeContext();
  return {
    mode: ctx.mode,
    isReady: ctx.isReady,
    setMode: ctx.setMode,
    toggle: ctx.toggle,
    isDark: ctx.mode === 'dark',
  };
}
