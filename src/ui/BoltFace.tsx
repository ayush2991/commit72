import { useMemo } from 'react';
import { PetMood } from '../pet/petHealth';
import { PixelGrid } from './PixelGrid';

// Blocky rock-bot silhouette with an antenna and stubby feet.
const SIL = [
  '................',
  '................',
  '.......##.......',
  '.......##.......',
  '....########....',
  '....########....',
  '....########....',
  '....########....',
  '....########....',
  '....########....',
  '....########....',
  '....########....',
  '....########....',
  '....########....',
  '...##....##.....',
  '................',
];

interface MoodVisual {
  top: string;
  body: string;
  bot: string;
  eye: string;
  antenna: string;
  ledCols: number[];
  sparkle: boolean;
  cracked: boolean;
  flicker: boolean;
}

const MOOD_VISUALS: Record<PetMood, MoodVisual> = {
  thriving: { top: '#94a3b8', body: '#7a8aa0', bot: '#5b6a80', eye: '#59f7cf', antenna: '#5cf2c8', ledCols: [6, 7, 8, 9], sparkle: true, cracked: false, flicker: false },
  happy: { top: '#8f9cae', body: '#78869a', bot: '#586475', eye: '#65e6cf', antenna: '#8f9cae', ledCols: [6, 7, 8, 9], sparkle: false, cracked: false, flicker: false },
  steady: { top: '#828d9c', body: '#6f7a8a', bot: '#4f5867', eye: '#8fcfc2', antenna: '#828d9c', ledCols: [6, 7, 8], sparkle: false, cracked: false, flicker: false },
  worried: { top: '#727986', body: '#616874', bot: '#434955', eye: '#c98f8f', antenna: '#727986', ledCols: [6, 9], sparkle: false, cracked: false, flicker: true },
  fading: { top: '#5e636d', body: '#4e535c', bot: '#3a3e46', eye: '#e04a34', antenna: '#a34', ledCols: [7], sparkle: false, cracked: true, flicker: false },
};

function buildGrid(mood: PetMood): (string | null)[][] {
  const v = MOOD_VISUALS[mood];
  const grid: (string | null)[][] = SIL.map((rowStr, r) =>
    rowStr.split('').map((ch) => {
      if (ch !== '#') return null;
      if (r <= 3) return v.antenna;
      if (r >= 12) return v.bot;
      if (r <= 5) return v.top;
      return v.body;
    })
  );
  const set = (c: number, r: number, color: string) => {
    grid[r][c] = color;
  };

  // Eyes: solid visor blocks, no pupils — a machine, not an animal.
  [[5, 6], [6, 6], [5, 7], [6, 7], [9, 6], [10, 6], [9, 7], [10, 7]].forEach(([c, r]) =>
    set(c, r, v.eye)
  );

  // LED mouth bar — fewer lit segments the worse things get.
  v.ledCols.forEach((c) => set(c, 10, v.eye));

  if (v.sparkle) {
    set(4, 2, v.antenna);
    set(11, 2, v.antenna);
  }
  if (v.cracked) {
    set(7, 5, v.bot);
    set(8, 8, v.bot);
    set(11, 5, '#ff6a3a');
  }
  if (v.flicker) {
    set(9, 6, v.bot);
  }

  return grid;
}

interface Props {
  mood: PetMood;
  size?: number;
}

/** Bolt: a little rock-bot — levitating with charged cyan eyes, or powered down and sparking. */
export function BoltFace({ mood, size = 152 }: Props) {
  const grid = useMemo(() => buildGrid(mood), [mood]);
  return <PixelGrid grid={grid} size={size} />;
}
