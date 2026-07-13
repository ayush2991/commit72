import { useMemo } from 'react';
import { View } from 'react-native';
import { PetMood } from '../pet/petHealth';

const COLS = 16;

// Rounded-blob silhouette, lifted pixel-for-pixel from the "PactPal" design
// doc's drawPip() — '#' is a filled body pixel, shared across all moods.
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
  shade: string;
  cheek: boolean;
  sadBrow: boolean;
  mouth: 'grin' | 'smile' | 'flat' | 'frown' | 'wail';
  sparkle: boolean;
  sweat: boolean;
  tears: boolean;
}

const MOOD_VISUALS: Record<PetMood, MoodVisual> = {
  thriving: {
    body: '#ff8a4c',
    shade: '#ef6d2c',
    cheek: true,
    sadBrow: false,
    mouth: 'grin',
    sparkle: true,
    sweat: false,
    tears: false,
  },
  happy: {
    body: '#ff9a5f',
    shade: '#f0793a',
    cheek: true,
    sadBrow: false,
    mouth: 'smile',
    sparkle: false,
    sweat: false,
    tears: false,
  },
  steady: {
    body: '#e2ac86',
    shade: '#cf9770',
    cheek: false,
    sadBrow: false,
    mouth: 'flat',
    sparkle: false,
    sweat: false,
    tears: false,
  },
  worried: {
    body: '#cbb6a4',
    shade: '#b49d89',
    cheek: false,
    sadBrow: true,
    mouth: 'frown',
    sparkle: false,
    sweat: true,
    tears: false,
  },
  fading: {
    body: '#9aa0a8',
    shade: '#838a92',
    cheek: false,
    sadBrow: true,
    mouth: 'wail',
    sparkle: false,
    sweat: false,
    tears: true,
  },
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
    color: '#4a3128',
  },
};

function buildGrid(mood: PetMood): (string | null)[][] {
  const v = MOOD_VISUALS[mood];
  const grid: (string | null)[][] = SIL.map((rowStr, r) =>
    rowStr.split('').map((ch) => (ch === '#' ? (r >= 11 ? v.shade : v.body) : null))
  );
  const set = (c: number, r: number, color: string) => {
    grid[r][c] = color;
  };

  // Eyes: 2x2 blocks, top-left pixel of each swapped for a highlight/sparkle.
  [[5, 6], [6, 6], [5, 7], [6, 7], [9, 6], [10, 6], [9, 7], [10, 7]].forEach(([c, r]) =>
    set(c, r, EYE_DARK)
  );
  set(5, 6, v.sparkle ? '#ffe08a' : '#ffffff');
  set(9, 6, v.sparkle ? '#ffe08a' : '#ffffff');

  if (v.sadBrow) {
    set(6, 5, EYE_DARK);
    set(9, 5, EYE_DARK);
  }
  if (v.cheek) {
    set(4, 8, '#ff5f8a');
    set(11, 8, '#ff5f8a');
  }

  const mouth = MOUTH_PIXELS[v.mouth];
  mouth.cells.forEach(([c, r]) => set(c, r, mouth.color));
  if (v.mouth === 'grin') set(7, 10, '#ff9db0'); // tongue

  if (v.sweat) set(11, 5, '#5aa6d6');
  if (v.tears) {
    set(5, 8, '#5aa6d6');
    set(10, 8, '#5aa6d6');
  }

  return grid;
}

interface Props {
  mood: PetMood;
  size?: number;
}

/** A small pixel-grid mascot face, hand-authored per mood (no image assets). */
export function PipFace({ mood, size = 152 }: Props) {
  const grid = useMemo(() => buildGrid(mood), [mood]);
  const cell = size / COLS;

  return (
    <View style={{ width: size, height: size }}>
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((color, c) => (
            <View
              key={c}
              style={{
                width: cell,
                height: cell,
                backgroundColor: color ?? 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
