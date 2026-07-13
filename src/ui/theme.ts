import { Platform, useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { TaskStatus } from '../task/types';

export type Scheme = 'light' | 'dark';

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

/** Resolves the current OS appearance to a palette; defaults to dark when unknown. */
export function useTheme() {
  const scheme: Scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  return useMemo(() => {
    const palette = palettes[scheme];
    return {
      scheme,
      colors: palette,
      statusColor: makeStatusColor(palette),
      badgeBg: makeBadgeBg(palette),
      mono,
    };
  }, [scheme]);
}
