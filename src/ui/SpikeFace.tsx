import { useMemo } from 'react';
import { PetMood } from '../pet/petHealth';
import { PixelGrid } from './PixelGrid';

// A potted cactus, not a seedling-on-a-stem — plumps up and flowers when
// thriving, shrivels and drops its bloom when neglected.
const SIL = [
  '................',
  '................',
  '.......##.......',
  '.......##.......',
  '......####......',
  '......####......',
  '...##.####.##...',
  '...##.####.##...',
  '......####......',
  '......####......',
  '......####......',
  '....########....',
  '....########....',
  '....########....',
  '....########....',
  '................',
];

const EYE_DARK = '#3a2410';

interface MoodVisual {
  body: string;
  pot: string;
  potShade: string;
  bloom: boolean;
  wilted: boolean;
  mouth: 'grin' | 'smile' | 'flat' | 'frown' | 'wail';
}

const MOOD_VISUALS: Record<PetMood, MoodVisual> = {
  thriving: { body: '#43c565', pot: '#c8703c', potShade: '#a85a2d', bloom: true, wilted: false, mouth: 'grin' },
  happy: { body: '#4fb85f', pot: '#c8703c', potShade: '#a85a2d', bloom: true, wilted: false, mouth: 'smile' },
  steady: { body: '#6a9a4a', pot: '#c8703c', potShade: '#a85a2d', bloom: false, wilted: false, mouth: 'flat' },
  worried: { body: '#8a8a3e', pot: '#b3663a', potShade: '#94532c', bloom: false, wilted: true, mouth: 'frown' },
  fading: { body: '#6e5c2e', pot: '#8a5c34', potShade: '#6e4826', bloom: false, wilted: true, mouth: 'wail' },
};

function buildGrid(mood: PetMood): (string | null)[][] {
  const v = MOOD_VISUALS[mood];
  const grid: (string | null)[][] = SIL.map((rowStr, r) =>
    rowStr.split('').map((ch) => (ch === '#' ? (r >= 11 ? v.potShade : v.body) : null))
  );
  const set = (c: number, r: number, color: string) => {
    grid[r][c] = color;
  };

  // Pot rim highlight.
  for (let c = 4; c <= 11; c++) set(c, 11, v.pot);

  // Small eyes and mouth on the pot.
  set(5, 12, EYE_DARK);
  set(10, 12, EYE_DARK);

  const mouth: [number, number][] =
    v.mouth === 'grin'
      ? [[6, 13], [7, 13], [8, 13], [9, 13]]
      : v.mouth === 'smile'
        ? [[6, 13], [9, 13]]
        : v.mouth === 'flat'
          ? [[7, 13], [8, 13]]
          : v.mouth === 'frown'
            ? [[6, 12], [9, 12]]
            : [[5, 13], [6, 13], [9, 13], [10, 13]]; // wail
  mouth.forEach(([c, r]) => set(c, r, EYE_DARK));

  if (v.bloom) {
    set(6, 1, '#ff5f8a');
    set(9, 1, '#ff5f8a');
    set(7, 0, '#ffd75f');
    set(8, 0, '#ffd75f');
  }

  if (v.wilted) {
    // Drooped tip and a couple of dry spine marks — no flower left.
    set(7, 3, v.pot);
    set(4, 6, v.pot);
    set(11, 7, v.pot);
  }

  return grid;
}

interface Props {
  mood: PetMood;
  size?: number;
}

/** Spike: a potted desert cactus — plump and flowering when tended, shriveled and dropped when neglected. */
export function SpikeFace({ mood, size = 152 }: Props) {
  const grid = useMemo(() => buildGrid(mood), [mood]);
  return <PixelGrid grid={grid} size={size} />;
}
