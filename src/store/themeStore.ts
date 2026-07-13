import { create } from 'zustand';
import type { ThemeId } from '../ui/theme';

export interface ThemeStore {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  themeId: 'default',
  setThemeId: (id) => set({ themeId: id }),
}));
