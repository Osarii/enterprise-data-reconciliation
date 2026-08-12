import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';

import type {
  PaletteMode,
} from '@mui/material';

import {
  THEME_MODE_STORAGE_KEY,
} from '../config/storageConfig';

import {
  createAppTheme,
} from '../theme';

interface ThemeModeContextType {
  mode: PaletteMode;
  setMode: (mode: PaletteMode) => void;
  toggleMode: () => void;
}

const ThemeModeContext =
  createContext<ThemeModeContextType | undefined>(undefined);

interface ThemeModeProviderProps {
  children: ReactNode;
}

export function ThemeModeProvider({
  children,
}: ThemeModeProviderProps) {
  const [mode, setModeState] = useState<PaletteMode>(
    getInitialMode
  );

  useEffect(() => {
    document.documentElement.dataset.colorMode = mode;

    try {
      window.localStorage.setItem(
        THEME_MODE_STORAGE_KEY,
        mode
      );
    } catch {
      // Theme still works for the current session if storage is unavailable.
    }
  }, [mode]);

  const setMode = useCallback((nextMode: PaletteMode) => {
    setModeState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((currentMode) =>
      currentMode === 'light' ? 'dark' : 'light'
    );
  }, []);

  const theme = useMemo(
    () => createAppTheme(mode),
    [mode]
  );

  const contextValue = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error(
      'useThemeMode must be used inside ThemeModeProvider'
    );
  }

  return context;
}

function getInitialMode(): PaletteMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const storedMode = window.localStorage.getItem(
      THEME_MODE_STORAGE_KEY
    );

    if (storedMode === 'light' || storedMode === 'dark') {
      return storedMode;
    }
  } catch {
    // Fall back to the operating-system preference below.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
