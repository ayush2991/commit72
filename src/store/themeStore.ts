import { Appearance } from 'react-native';
import { create } from 'zustand';
import type { Scheme, ThemeId } from '../ui/theme';

export interface ThemeStore {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  mode: Scheme;
  setMode: (mode: Scheme) => void;
  toggleMode: () => void;
}

// Seeds the initial mode from the OS appearance exactly once, at store
// creation. After this the store's `mode` is the sole source of truth —
// there is no per-render OS re-read (see useTheme() in ui/theme.ts).
const initialMode: Scheme = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';

export const useThemeStore = create<ThemeStore>((set) => ({
  themeId: 'default',
  setThemeId: (id) => set({ themeId: id }),
  mode: initialMode,
  setMode: (mode) => set({ mode }),
  toggleMode: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
}));
