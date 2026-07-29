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

/**
 * Re-reads the OS scheme and corrects `mode` if it's out of sync. The seed
 * value above is captured at module-import time, which on a cold start can
 * race ahead of the native Appearance module reporting its real value — and
 * since nothing else re-checks until the OS scheme actually changes, a bad
 * snapshot sticks forever if the device just stays on one scheme. Call this
 * from app-foreground/mount, mirroring how App.tsx already re-runs sweep()
 * on resume to self-correct rather than trusting a stale in-memory read.
 */
export function resyncSystemMode(): void {
  if (useThemeStore.getState().modePreference === 'system') {
    useThemeStore.setState({ mode: resolveSystemScheme() });
  }
}

// Keeps the resolved `mode` synced to live OS appearance changes while the
// user's preference is 'system'. A 'light'/'dark' preference is user-locked
// and this listener leaves it alone.
Appearance.addChangeListener(({ colorScheme }) => {
  if (useThemeStore.getState().modePreference === 'system') {
    useThemeStore.setState({ mode: colorScheme === 'dark' ? 'dark' : 'light' });
  }
});
