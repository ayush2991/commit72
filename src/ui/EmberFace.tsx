import { useMemo } from 'react';
import { PetMood } from '../pet/petHealth';
import { PixelGrid } from './PixelGrid';

// A tapered flame silhouette — same face coordinate scheme as PipFace (the
// body is wide enough at rows 6-11 to reuse identical eye/mouth placement).
const SIL = [
  '................',
  '................',
  '.......##.......',
  '......####......',
  '.....######.....',
  '....########....',
  '...##########...',
  '..############..',
  '..############..',
  '.##############.',
  '.##############.',
  '.##############.',
  '..############..',
  '..############..',
  '...##########...',
  '................',
];

const EYE_DARK = '#3a1608';

interface MoodVisual {
  outer: string;
  inner: string;
  sadBrow: boolean;
  mouth: 'grin' | 'smile' | 'flat' | 'frown' | 'wail';
  sparkle: boolean;
  rising: boolean; // embers drifting up, burning bright
  chill: boolean; // cold blue wisp, guttering out
}

const MOOD_VISUALS: Record<PetMood, MoodVisual> = {
  thriving: { outer: '#ff8a1e', inner: '#ffc23a', sadBrow: false, mouth: 'grin', sparkle: true, rising: true, chill: false },
  happy: { outer: '#ff9a3c', inner: '#f0973c', sadBrow: false, mouth: 'smile', sparkle: false, rising: true, chill: false },
  steady: { outer: '#e0722a', inner: '#c76a2e', sadBrow: false, mouth: 'flat', sparkle: false, rising: false, chill: false },
  worried: { outer: '#a86438', inner: '#8f5730', sadBrow: true, mouth: 'frown', sparkle: false, rising: false, chill: true },
  fading: { outer: '#4a79ac', inner: '#375d87', sadBrow: true, mouth: 'wail', sparkle: false, rising: false, chill: true },
};

const MOUTH_PIXELS: Record<MoodVisual['mouth'], { cells: [number, number][]; color: string }> = {
  grin: {
    cells: [
      [6, 9], [7, 9], [8, 9],
      [6, 10], [7, 10], [8, 10],
      [7, 11],
    ],
    color: '#7a2d12',
  },
  smile: { cells: [[6, 9], [7, 10], [8, 9]], color: EYE_DARK },
  flat: { cells: [[6, 10], [7, 10], [8, 10]], color: EYE_DARK },
  frown: { cells: [[6, 10], [7, 9], [8, 10]], color: EYE_DARK },
  wail: {
    cells: [
      [6, 9], [7, 9], [8, 9],
      [6, 10], [8, 10],
      [6, 11], [7, 11], [8, 11],
    ],
    color: '#2a3d52',
  },
};

function buildGrid(mood: PetMood): (string | null)[][] {
  const v = MOOD_VISUALS[mood];
  const grid: (string | null)[][] = SIL.map((rowStr, r) =>
    rowStr.split('').map((ch) => (ch === '#' ? (r >= 11 ? v.inner : v.outer) : null))
  );
  const set = (c: number, r: number, color: string) => {
    grid[r][c] = color;
  };

  [[5, 6], [6, 6], [5, 7], [6, 7], [9, 6], [10, 6], [9, 7], [10, 7]].forEach(([c, r]) =>
    set(c, r, EYE_DARK)
  );
  set(5, 6, v.sparkle ? '#ffe08a' : '#ffffff');
  set(9, 6, v.sparkle ? '#ffe08a' : '#ffffff');

  if (v.sadBrow) {
    set(6, 5, EYE_DARK);
    set(9, 5, EYE_DARK);
  }

  const mouth = MOUTH_PIXELS[v.mouth];
  mouth.cells.forEach(([c, r]) => set(c, r, mouth.color));

  if (v.rising) {
    set(6, 1, '#ffb84a');
    set(9, 0, '#ffce70');
  }
  if (v.chill) {
    set(11, 6, '#8fb4d6');
  }

  return grid;
}

interface Props {
  mood: PetMood;
  size?: number;
}

/** Ember: a living streak-flame that burns tall and gold, or gutters to a cold blue flicker. */
export function EmberFace({ mood, size = 152 }: Props) {
  const grid = useMemo(() => buildGrid(mood), [mood]);
  return <PixelGrid grid={grid} size={size} />;
}
