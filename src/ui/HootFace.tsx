import { useMemo } from 'react';
import { PetMood } from '../pet/petHealth';
import { PixelGrid } from './PixelGrid';

// Same rounded-blob body as Pip (identical eye/mouth coordinates), plus ear
// tufts and feet layered on as mood-dependent accents.
const SIL = [
  '................',
  '................',
  '.....#####......',
  '....#######.....',
  '...#########....',
  '..###########...',
  '..###########...',
  '..###########...',
  '..###########...',
  '..###########...',
  '..###########...',
  '..###########...',
  '...#########....',
  '....#######.....',
  '.....#####......',
  '................',
];

const EYE_DARK = '#241812';

interface MoodVisual {
  body: string;
  belly: string;
  feet: string;
  tuftsUp: boolean;
  sadBrow: boolean;
  mouth: 'grin' | 'smile' | 'flat' | 'frown' | 'wail';
  sparkle: boolean;
  raincloud: boolean;
}

const MOOD_VISUALS: Record<PetMood, MoodVisual> = {
  thriving: { body: '#c9873f', belly: '#f0d19a', feet: '#f0a12e', tuftsUp: true, sadBrow: false, mouth: 'grin', sparkle: true, raincloud: false },
  happy: { body: '#c48a45', belly: '#eccf98', feet: '#f0a12e', tuftsUp: true, sadBrow: false, mouth: 'smile', sparkle: false, raincloud: false },
  steady: { body: '#ad8a58', belly: '#d8cba8', feet: '#d98a1e', tuftsUp: true, sadBrow: false, mouth: 'flat', sparkle: false, raincloud: false },
  worried: { body: '#95917f', belly: '#c3c3bb', feet: '#c07a1a', tuftsUp: false, sadBrow: true, mouth: 'frown', sparkle: false, raincloud: true },
  fading: { body: '#8b929c', belly: '#bcc2ca', feet: '#8a5c1a', tuftsUp: false, sadBrow: true, mouth: 'wail', sparkle: false, raincloud: true },
};

const MOUTH_PIXELS: Record<MoodVisual['mouth'], { cells: [number, number][]; color: string }> = {
  grin: { cells: [[6, 9], [7, 9], [8, 9], [7, 10]], color: '#7a2d12' },
  smile: { cells: [[6, 9], [7, 10], [8, 9]], color: EYE_DARK },
  flat: { cells: [[6, 10], [7, 10], [8, 10]], color: EYE_DARK },
  frown: { cells: [[6, 10], [7, 9], [8, 10]], color: EYE_DARK },
  wail: { cells: [[6, 9], [7, 9], [8, 9], [7, 10]], color: '#3a3428' },
};

function buildGrid(mood: PetMood): (string | null)[][] {
  const v = MOOD_VISUALS[mood];
  const grid: (string | null)[][] = SIL.map((rowStr) =>
    rowStr.split('').map((ch) => (ch === '#' ? v.body : null))
  );
  const set = (c: number, r: number, color: string) => {
    grid[r][c] = color;
  };

  // Belly patch.
  [[6, 8], [7, 8], [8, 9], [6, 9], [7, 9], [6, 10], [7, 10], [8, 10], [6, 11], [7, 11]].forEach(
    ([c, r]) => set(c, r, v.belly)
  );

  // Eyes.
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

  // Ear tufts: perky up top when doing well, drooped to the sides when not.
  if (v.tuftsUp) {
    set(3, 1, v.body);
    set(4, 1, v.body);
    set(11, 1, v.body);
    set(12, 1, v.body);
  } else {
    set(2, 3, v.body);
    set(13, 3, v.body);
  }

  // Feet.
  set(6, 15, v.feet);
  set(7, 15, v.feet);
  set(9, 15, v.feet);
  set(10, 15, v.feet);

  if (v.raincloud) {
    set(6, 0, '#7a828c');
    set(7, 0, '#7a828c');
    set(8, 0, '#7a828c');
    set(7, 1, '#5aa6d6');
  }

  return grid;
}

interface Props {
  mood: PetMood;
  size?: number;
}

/** Hoot: a pocket owl on watch — bright-eyed and puffed up, or drenched under its own rain cloud. */
export function HootFace({ mood, size = 152 }: Props) {
  const grid = useMemo(() => buildGrid(mood), [mood]);
  return <PixelGrid grid={grid} size={size} />;
}
