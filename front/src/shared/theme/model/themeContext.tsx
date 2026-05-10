import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { vars } from 'nativewind';
import { View, type ViewStyle } from 'react-native';
import { storage } from '../../lib/storage';
import { TOKENS_BY_MODE, type ThemeMode } from '../tokens';

interface ThemeContextValue {
  mode: ThemeMode;
  isReady: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

// Тёмная тема выбрана дефолтом по двум причинам:
// 1) В splash-screen уже индиго фон #5856D6 — переход на тёмный UI
//    выглядит плавно, светлый бы создал «вспышку» при первом запуске.
// 2) Большинство мобильных пользователей сейчас живут в системной dark mode,
//    open-light приложение в OLED-комнате слепит.
// Если пользователь переключился руками — переключатель сохраняется в
// SecureStore (см. setMode), и при следующем запуске мы прочитаем сохранённое
// значение, а DEFAULT_MODE не используется.
const DEFAULT_MODE: ThemeMode = 'dark';

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    storage.getThemeMode().then((stored) => {
      if (!mounted) return;
      if (stored) setModeState(stored);
      setIsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void storage.setThemeMode(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((current) => {
      const next: ThemeMode = current === 'light' ? 'dark' : 'light';
      void storage.setThemeMode(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, isReady, setMode, toggle }),
    [mode, isReady, setMode, toggle],
  );

  const themeStyle = useMemo<ViewStyle>(
    () => vars(TOKENS_BY_MODE[mode]) as ViewStyle,
    [mode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeStyle]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used inside <ThemeProvider>');
  }
  return ctx;
}
