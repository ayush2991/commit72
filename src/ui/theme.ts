import { Platform, useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { TaskStatus } from '../task/types';
import { useThemeStore } from '../store/themeStore';

export type Scheme = 'light' | 'dark';
export type ThemeId = 'default' | 'brutalist' | 'lockIn';

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

// Lifted from the "1a — LOCK IN" mockup option (Commit72.dc.html /
// PactPal.dc.html): a fixed disciplined-dark look, distinct from the
// OS-driven default dark palette above (different status hues — active
// tasks read blue "fresh" / green "mid" here, not green/yellow).
const lockInColors: Palette = {
  bg: '#0a0a0b',
  bgElevated: '#0e0e11',
  panel: '#151517',
  panel2: '#1b1d23',
  border: '#222226',
  text: '#f5f5f4',
  textDim: '#6b6b70',
  textFaint: '#5c5a63',

  fresh: '#64d2ff',
  mid: '#30d158',
  urgent: '#ff453a',
  failed: '#8e8e93',

  accent: '#ff453a',
  backdrop: 'rgba(0,0,0,0.6)',
  failedCardBg: '#151517',
  failedCardBorder: '#2a2a2e',
  trackBg: '#26262a',
  urgentBorderAlpha: 'rgba(255,69,58,0.5)',
  badgeFailedText: '#8c8e94',

  badgeFreshBg: 'rgba(100,210,255,0.15)',
  badgeMidBg: 'rgba(48,209,88,0.15)',
  badgeUrgentBg: 'rgba(255,69,58,0.18)',
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

/**
 * Shared shape/spacing tokens so sheets, cards, and buttons across the app
 * (CommitModal, ConfirmModal, TaskCard, ...) agree on the same radii instead
 * of each component picking its own isBrutalist ? X : Y numbers.
 */
export interface RadiusScale {
  sheet: number; // bottom-sheet modals (top corners)
  box: number; // clock/stat boxes, primary buttons
  field: number; // text inputs, small controls
}

const RADIUS: Record<'default' | 'brutalist', RadiusScale> = {
  default: { sheet: 28, box: 16, field: 14 },
  brutalist: { sheet: 8, box: 6, field: 6 },
};

export const spacing = { xs: 6, sm: 12, md: 16, lg: 20, xl: 24 } as const;

function makeRadius(isBrutalist: boolean): RadiusScale {
  return isBrutalist ? RADIUS.brutalist : RADIUS.default;
}

const FIXED_PALETTES: Partial<Record<ThemeId, Palette>> = {
  brutalist: brutalistColors,
  lockIn: lockInColors,
};

/**
 * Resolves the active theme. When the user has picked 'default' (the store's
 * initial value), this follows the OS appearance as before. Every other
 * ThemeId maps to a single fixed palette regardless of OS scheme.
 */
export function useTheme() {
  const themeId = useThemeStore((s) => s.themeId);
  const osScheme: Scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const fixed = FIXED_PALETTES[themeId];
  const scheme: Scheme = fixed ? (themeId === 'brutalist' ? 'light' : 'dark') : osScheme;
  const isBrutalist = themeId === 'brutalist';
  return useMemo(() => {
    const palette = fixed ?? palettes[scheme];
    return {
      scheme,
      themeId,
      isBrutalist,
      colors: palette,
      statusColor: makeStatusColor(palette),
      badgeBg: makeBadgeBg(palette),
      mono,
      radius: makeRadius(isBrutalist),
      spacing,
    };
  }, [themeId, scheme, isBrutalist]);
}
