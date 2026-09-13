import { create } from 'zustand';
import { dbLoadUITheme, dbSaveUITheme } from '../db';
import type { UITheme } from '../types';

interface UIThemeState {
  theme: UITheme;
  persistenceError: boolean;
  setTheme: (theme: UITheme) => void;
}

export const useUIThemeStore = create<UIThemeState>()((set) => ({
  theme: 'light',
  persistenceError: false,
  setTheme: (theme) => {
    document.documentElement.dataset.uiTheme = theme;
    set({ theme, persistenceError: !dbSaveUITheme(theme) });
  },
}));

export function initializeUITheme() {
  const theme = dbLoadUITheme();
  document.documentElement.dataset.uiTheme = theme;
  useUIThemeStore.setState({ theme, persistenceError: false });
}
