import { Platform } from 'react-native';
import { TaskStatus } from '../task/types';

/**
 * Design tokens lifted from index.html (the interactive mockup) so the app
 * matches the intended product look. HSL values from the mockup are converted
 * to hex/rgba here since React Native styles don't accept CSS `hsl()`.
 */
export const colors = {
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
} as const;

// Badge backgrounds are the status color at low opacity (mockup uses hsla).
export const badgeBg: Record<TaskStatus, string> = {
  done: 'rgba(61,220,132,0.15)',
  fresh: 'rgba(61,220,132,0.15)',
  mid: 'rgba(245,197,66,0.15)',
  urgent: 'rgba(244,71,52,0.18)',
  failed: '#2a2b2f',
};

export const statusColor: Record<TaskStatus, string> = {
  done: colors.fresh,
  fresh: colors.fresh,
  mid: colors.mid,
  urgent: colors.urgent,
  failed: colors.failed,
};

// Countdown numbers and timestamps are monospace in the mockup.
export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});
