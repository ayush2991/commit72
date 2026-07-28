import { Appearance } from 'react-native';
import { create } from 'zustand';
import type { Scheme, ThemeId } from '../ui/theme';

/** The user's Mode choice: an explicit scheme, or 'system' to follow the OS. */
export type ModePreference = Scheme | 'system';

function resolveSystemScheme(): Scheme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export interface ThemeStore {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  /** The raw user choice — 'light' | 'dark' | 'system' — shown selected in the Mode picker. */
  modePreference: ModePreference;
  /** The resolved light/dark scheme every themed component actually renders with. */
  mode: Scheme;
  setModePreference: (pref: ModePreference) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  themeId: 'default',
  setThemeId: (id) => set({ themeId: id }),
  modePreference: 'system',
  mode: resolveSystemScheme(),
  setModePreference: (pref) =>
    set({ modePreference: pref, mode: pref === 'system' ? resolveSystemScheme() : pref }),
}));

// Keeps the resolved `mode` synced to live OS appearance changes while the
// user's preference is 'system'. A 'light'/'dark' preference is user-locked
// and this listener leaves it alone.
Appearance.addChangeListener(({ colorScheme }) => {
  if (useThemeStore.getState().modePreference === 'system') {
    useThemeStore.setState({ mode: colorScheme === 'dark' ? 'dark' : 'light' });
  }
});
