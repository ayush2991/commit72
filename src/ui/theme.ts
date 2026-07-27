import { Platform, TextStyle, useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { TaskStatus } from '../task/types';
import { useThemeStore } from '../store/themeStore';

export type Scheme = 'light' | 'dark';
export type ThemeId = 'default' | 'brutalist' | 'neonArcade' | 'sunrise' | 'terminal';

export interface Palette {
  bg: string;
  bgElevated: string;
  panel: string;
  panel2: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;

  fresh: string;
  mid: string;
  urgent: string;
  failed: string;

  accent: string;
  backdrop: string;
  failedCardBg: string;
  failedCardBorder: string;
  trackBg: string;
  urgentBorderAlpha: string;
  badgeFailedText: string;

  badgeFreshBg: string;
  badgeMidBg: string;
  badgeUrgentBg: string;
}

/**
 * Design tokens lifted from index.html (the interactive mockup) so the app
 * matches the intended product look. HSL values from the mockup are converted
 * to hex/rgba here since React Native styles don't accept CSS `hsl()`.
 */
const darkColors: Palette = {
  bg: '#08090b',
  bgElevated: '#0d0e12',
  panel: '#141519',
  panel2: '#1b1d23',
  border: '#26282f',
  text: '#f4f4f5',
  textDim: '#8a8d96',
  textFaint: '#54575f',

  fresh: '#3ddc84',
  mid: '#f5c542',
  urgent: '#f44734', // hsl(6 90% 58%)
  failed: '#6b6e76',

  accent: '#f2643a', // hsl(6 85% 55%)
  backdrop: 'rgba(0,0,0,0.55)',
  failedCardBg: '#151517',
  failedCardBorder: '#2a2b2f',
  trackBg: '#232429',
  urgentBorderAlpha: 'rgba(244,71,52,0.5)',
  badgeFailedText: '#8c8e94',

  badgeFreshBg: 'rgba(61,220,132,0.15)',
  badgeMidBg: 'rgba(245,197,66,0.15)',
  badgeUrgentBg: 'rgba(244,71,52,0.18)',
};

const lightColors: Palette = {
  bg: '#f7f7f8',
  bgElevated: '#ffffff',
  panel: '#ffffff',
  panel2: '#f0f0f2',
  border: '#e2e2e6',
  text: '#0d0e12',
  textDim: '#5c5f68',
  textFaint: '#9296a0',

  fresh: '#1fa25a',
  mid: '#a3760a',
  urgent: '#d8321e',
  failed: '#9a9da5',

  accent: '#d8321e',
  backdrop: 'rgba(0,0,0,0.35)',
  failedCardBg: '#f1f1f3',
  failedCardBorder: '#dcdce0',
  trackBg: '#e6e6ea',
  urgentBorderAlpha: 'rgba(216,50,30,0.35)',
  badgeFailedText: '#6b6e76',

  badgeFreshBg: 'rgba(31,162,90,0.12)',
  badgeMidBg: 'rgba(163,118,10,0.12)',
  badgeUrgentBg: 'rgba(216,50,30,0.14)',
};

// Lifted from the "1e — BLOCK" mockup option (Commit72.dc.html): a fixed
// high-contrast paper/ink look, not an OS light/dark variant.
const brutalistColors: Palette = {
  bg: '#e8e5dc',
  bgElevated: '#ffffff',
  panel: '#ffffff',
  panel2: '#ded9cc',
  border: '#111111',
  text: '#111111',
  textDim: '#5c5a53',
  textFaint: '#8a8a8a',

  fresh: '#4d4dff',
  mid: '#00a86b',
  urgent: '#ff3b19',
  failed: '#8a8a8a',

  accent: '#ff3b19',
  backdrop: 'rgba(17,17,17,0.55)',
  failedCardBg: '#ddd8cb',
  failedCardBorder: '#3a3a3a',
  trackBg: '#d9d4c6',
  urgentBorderAlpha: 'rgba(255,59,25,0.5)',
  badgeFailedText: '#5c5a53',

  badgeFreshBg: 'rgba(77,77,255,0.16)',
  badgeMidBg: 'rgba(0,168,107,0.16)',
  badgeUrgentBg: 'rgba(255,59,25,0.18)',
};

// Deep purple-black void with magenta/cyan neon accents — an arcade-cabinet
// mood, deliberately far from the neutral grays of the default dark theme.
const neonArcadeColors: Palette = {
  bg: '#0b0014',
  bgElevated: '#120022',
  panel: '#1a0330',
  panel2: '#24044a',
  border: '#3d0a6b',
  text: '#f5eaff',
  textDim: '#b9a4d9',
  textFaint: '#7c6a99',

  fresh: '#39ff9e',
  mid: '#ffe14d',
  urgent: '#ff2e88',
  failed: '#6f6180',

  accent: '#ff2e88',
  backdrop: 'rgba(10,0,20,0.65)',
  failedCardBg: '#180226',
  failedCardBorder: '#3d0a6b',
  trackBg: '#24044a',
  urgentBorderAlpha: 'rgba(255,46,136,0.5)',
  badgeFailedText: '#b9a4d9',

  badgeFreshBg: 'rgba(57,255,158,0.16)',
  badgeMidBg: 'rgba(255,225,77,0.16)',
  badgeUrgentBg: 'rgba(255,46,136,0.2)',
};

// Warm cream/peach with coral + teal accents — optimistic morning light,
// distinct from Brutalist's stark paper/ink.
const sunriseColors: Palette = {
  bg: '#fff3ea',
  bgElevated: '#ffffff',
  panel: '#fffaf5',
  panel2: '#ffe9d6',
  border: '#f3c9a8',
  text: '#3a2a20',
  textDim: '#8a6f5c',
  textFaint: '#b89a82',

  fresh: '#2a9d8f',
  mid: '#e9a13b',
  urgent: '#e8613f',
  failed: '#b8a190',

  accent: '#e8613f',
  backdrop: 'rgba(58,42,32,0.35)',
  failedCardBg: '#f6e6d8',
  failedCardBorder: '#e3c3a0',
  trackBg: '#ffe9d6',
  urgentBorderAlpha: 'rgba(232,97,63,0.35)',
  badgeFailedText: '#8a6f5c',

  badgeFreshBg: 'rgba(42,157,143,0.14)',
  badgeMidBg: 'rgba(233,161,59,0.16)',
  badgeUrgentBg: 'rgba(232,97,63,0.16)',
};

// Pure-black CRT terminal — monochrome phosphor green with a single red
// alarm hue, sharp corners, monospace throughout.
const terminalColors: Palette = {
  bg: '#000000',
  bgElevated: '#050a05',
  panel: '#0a120a',
  panel2: '#0f1c0f',
  border: '#1c3d1c',
  text: '#baffc9',
  textDim: '#5ea86e',
  textFaint: '#3d5c3d',

  fresh: '#33ff66',
  mid: '#99ff33',
  urgent: '#ff3333',
  failed: '#3d5c3d',

  accent: '#ff3333',
  backdrop: 'rgba(0,0,0,0.7)',
  failedCardBg: '#050a05',
  failedCardBorder: '#1c3d1c',
  trackBg: '#0f1c0f',
  urgentBorderAlpha: 'rgba(255,51,51,0.5)',
  badgeFailedText: '#5ea86e',

  badgeFreshBg: 'rgba(51,255,102,0.15)',
  badgeMidBg: 'rgba(153,255,51,0.15)',
  badgeUrgentBg: 'rgba(255,51,51,0.2)',
};

const palettes: Record<Scheme, Palette> = { dark: darkColors, light: lightColors };

export function makeStatusColor(p: Palette): Record<TaskStatus, string> {
  return { done: p.fresh, fresh: p.fresh, mid: p.mid, urgent: p.urgent, failed: p.failed };
}

export function makeBadgeBg(p: Palette): Record<TaskStatus, string> {
  return {
    done: p.badgeFreshBg,
    fresh: p.badgeFreshBg,
    mid: p.badgeMidBg,
    urgent: p.badgeUrgentBg,
    failed: p.failedCardBorder,
  };
}

// Countdown numbers and timestamps are monospace in the mockup.
export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

// A built-in condensed system stack (no bundled font) for Neon Arcade's
// marquee-style title: iOS/Android both ship a condensed system face, this
// is the closest widely-available web equivalent for parity in tooling.
const condensedDisplay = 'Arial Narrow, "Helvetica Neue Condensed", sans-serif';

// A built-in serif stack (no bundled font) for Sunrise's warm editorial feel.
const serifDisplay = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

/**
 * Shared shape/spacing tokens so sheets, cards, and buttons across the app
 * (CommitModal, ConfirmModal, TaskCard, ...) agree on the same radii instead
 * of each component picking its own hardEdges ? X : Y numbers.
 */
export interface RadiusScale {
  sheet: number; // bottom-sheet modals (top corners)
  box: number; // clock/stat boxes, primary buttons
  field: number; // text inputs, small controls
}

export const spacing = { xs: 6, sm: 12, md: 16, lg: 20, xl: 24 } as const;

const roundedRadius: RadiusScale = { sheet: 28, box: 16, field: 14 };
const sharpRadius: RadiusScale = { sheet: 8, box: 6, field: 6 };
const terminalRadius: RadiusScale = { sheet: 12, box: 4, field: 4 };

/**
 * Shape tokens: replaces the old scattered `isBrutalist ? X : Y` ternaries
 * duplicated across TaskCard/PipCard/TabBar/PetPicker/ProfileScreen/
 * CommitModal/ConfirmModal/TimelineScreen. `hardEdges` themes get thicker
 * borders and a hard offset drop-shadow instead of none.
 */
export interface ThemeShape {
  radius: RadiusScale;
  hardEdges: boolean;
}

/**
 * Typography tokens per theme. `display`/`body` are font-family overrides;
 * `undefined` keeps the platform default (React Native's system font), same
 * as the app's behavior before this theme had any font opinion.
 */
export interface ThemeType {
  display?: string;
  body?: string;
  titleWeight: TextStyle['fontWeight'];
  titleTracking: number;
  titleCase: 'none' | 'uppercase';
  badgeDecoration?: { prefix?: string; suffix?: string };
  tabActivePrefix?: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  /** Omitted only for 'default', which follows the OS light/dark setting. */
  scheme?: Scheme;
  /** Omitted only for 'default', which resolves colors from `scheme` instead. */
  colors?: Palette;
  shape: ThemeShape;
  type: ThemeType;
}

const defaultType: ThemeType = {
  titleWeight: '800',
  titleTracking: -0.5,
  titleCase: 'none',
};

/**
 * Single source of truth for every theme: palette, shape, and typography.
 * `useTheme()` and the Profile screen's picker both read this — adding or
 * changing a theme only ever means editing an entry here.
 */
export const THEME_REGISTRY: Record<ThemeId, ThemeDefinition> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'Follows your device light/dark setting.',
    shape: { radius: roundedRadius, hardEdges: false },
    type: defaultType,
  },
  brutalist: {
    id: 'brutalist',
    label: 'Brutalist Block',
    description: 'High-contrast paper & ink.',
    scheme: 'light',
    colors: brutalistColors,
    shape: { radius: sharpRadius, hardEdges: true },
    type: defaultType,
  },
  neonArcade: {
    id: 'neonArcade',
    label: 'Neon Arcade',
    description: 'Synthwave purple-black with magenta/cyan energy.',
    scheme: 'dark',
    colors: neonArcadeColors,
    shape: { radius: roundedRadius, hardEdges: false },
    type: {
      display: condensedDisplay,
      body: condensedDisplay,
      titleWeight: '900',
      titleTracking: 2.5,
      titleCase: 'uppercase',
      badgeDecoration: { prefix: '▸ ' },
      tabActivePrefix: '▸ ',
    },
  },
  sunrise: {
    id: 'sunrise',
    label: 'Sunrise',
    description: 'Warm cream & peach, coral and teal accents.',
    scheme: 'light',
    colors: sunriseColors,
    shape: { radius: roundedRadius, hardEdges: false },
    type: {
      display: serifDisplay,
      body: serifDisplay,
      titleWeight: '700',
      titleTracking: -0.3,
      titleCase: 'none',
    },
  },
  terminal: {
    id: 'terminal',
    label: 'Terminal',
    description: 'Pure-black CRT, phosphor green, monospace throughout.',
    scheme: 'dark',
    colors: terminalColors,
    shape: { radius: terminalRadius, hardEdges: true },
    type: {
      display: mono,
      body: mono,
      titleWeight: '700',
      titleTracking: 0.5,
      titleCase: 'none',
      badgeDecoration: { prefix: '[', suffix: ']' },
      tabActivePrefix: '> ',
    },
  },
};

/** Display order for the Profile screen's theme picker. */
export const THEME_ORDER: ThemeId[] = ['default', 'brutalist', 'neonArcade', 'sunrise', 'terminal'];

/**
 * Resolves the active theme. When the user has picked 'default' (the store's
 * initial value), this follows the OS appearance as before. Every other
 * ThemeId maps to a single fixed palette/shape/type regardless of OS scheme.
 */
export function useTheme() {
  const themeId = useThemeStore((s) => s.themeId);
  const osScheme: Scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const def = THEME_REGISTRY[themeId];
  const scheme: Scheme = def.scheme ?? osScheme;
  const colors = def.colors ?? palettes[scheme];
  return useMemo(() => {
    return {
      scheme,
      themeId,
      colors,
      statusColor: makeStatusColor(colors),
      badgeBg: makeBadgeBg(colors),
      mono,
      shape: def.shape,
      type: def.type,
      spacing,
    };
  }, [themeId, scheme, colors, def]);
}
