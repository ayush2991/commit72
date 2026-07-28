import { Appearance } from 'react-native';
import { create } from 'zustand';
import { THEME_REGISTRY, type Scheme, type ThemeId } from '../ui/theme';
import { SQLiteSettingsRepository } from './settingsRepository';

/** The user's Mode choice: an explicit scheme, or 'system' to follow the OS. */
export type ModePreference = Scheme | 'system';

const THEME_ID_KEY = 'themeId';
const MODE_PREFERENCE_KEY = 'modePreference';

function resolveSystemScheme(): Scheme {
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

function isThemeId(value: string | undefined): value is ThemeId {
  return value !== undefined && value in THEME_REGISTRY;
}

function isModePreference(value: string | undefined): value is ModePreference {
  return value === 'light' || value === 'dark' || value === 'system';
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

const repository = new SQLiteSettingsRepository();

// Seeded from the SQLite-backed settings table so the chosen theme and mode
// preference survive the app process being killed (force-close), instead of
// resetting to 'default'/'system' on next launch the way an in-memory-only
// store would.
const storedThemeId = repository.get(THEME_ID_KEY);
const storedModePreference = repository.get(MODE_PREFERENCE_KEY);
const initialModePreference: ModePreference = isModePreference(storedModePreference)
  ? storedModePreference
  : 'system';

export const useThemeStore = create<ThemeStore>((set) => ({
  themeId: isThemeId(storedThemeId) ? storedThemeId : 'default',
  setThemeId: (id) => {
    repository.set(THEME_ID_KEY, id);
    set({ themeId: id });
  },
  modePreference: initialModePreference,
  mode: initialModePreference === 'system' ? resolveSystemScheme() : initialModePreference,
  setModePreference: (pref) => {
    repository.set(MODE_PREFERENCE_KEY, pref);
    set({ modePreference: pref, mode: pref === 'system' ? resolveSystemScheme() : pref });
  },
}));

// Keeps the resolved `mode` synced to live OS appearance changes while the
// user's preference is 'system'. A 'light'/'dark' preference is user-locked
// and this listener leaves it alone.
Appearance.addChangeListener(({ colorScheme }) => {
  if (useThemeStore.getState().modePreference === 'system') {
    useThemeStore.setState({ mode: colorScheme === 'light' ? 'light' : 'dark' });
  }
});
