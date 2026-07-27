import { PetMood } from '../pet/petHealth';
import { PixelGrid } from './PixelGrid';
import { BODY_SCALE, createGrid, Grid, moodIndex, paintScaled, SWAY_SPEED } from './petPixelGrid';
import { usePetClock } from './usePetClock';

// Tufted-owl silhouette (distinct from Pip's rounded blob) — pointy ear tufts droop away as
// mood worsens instead of just changing color.
const OSIL = [
  '................', '................', '................', '....#....#......',
  '...###..###.....', '..############..', '..############..', '.##############.',
  '.##############.', '.##############.', '..############..', '..############..',
  '..############..', '...##########...', '....#..##..#....', '................',
];

const BODY = ['#c9873f', '#c48a45', '#ad8a58', '#95917f', '#8b929c'];
const BELLY = ['#f0d19a', '#eccf98', '#d8cba8', '#c3c3bb', '#bcc2ca'];
const BEAK = ['#f0a12e', '#f0a12e', '#d98a1e', '#c07a1a', '#8a5c1a'];
const BOB_AMOUNT = [0.7, 0.47, 0.35, 0.23, 0.12];
const WHITE = '#fff';
const DARK = '#1a1410';

function buildGrid(mood: PetMood, t: number): Grid {
  const grid = createGrid();
  const i = moodIndex(mood);
  const sc = BODY_SCALE[i];
  const bob = Math.sin(t * SWAY_SPEED[i]) * BOB_AMOUNT[i];
  const P = (c: number, r: number, color: string) => paintScaled(grid, c, r, color, { scale: sc, rowOffset: bob });

  if (i === 4) {
    (
      [[4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [5, 1], [6, 1], [9, 1], [10, 1]] as const
    ).forEach(([c, r]) => P(c, r, '#7a828c'));
    [4, 7, 10].forEach((c, k) => {
      const yy = (t * 3 + k * 0.9) % 2.5;
      P(c, 2 + yy, '#5aa6d6');
    });
  }

  for (let r = 0; r < OSIL.length; r++) {
    for (let c = 0; c < 16; c++) {
      if (OSIL[r][c] !== '#') continue;
      if (r <= 4 && (c <= 4 || c >= 11) && i >= 2) continue; // ear tufts droop away for i>=2
      P(c, r, BODY[i]);
    }
  }
  if (i >= 2) {
    P(3, 6 + (i - 2), BODY[i]);
    P(12, 6 + (i - 2), BODY[i]);
  }

  for (let r = 8; r <= 13; r++) {
    const w = Math.max(1, r <= 12 ? 3 : 2);
    for (let c = 7 - w; c <= 7 + w; c++) if (c >= 3 && c <= 12) P(c, r, BELLY[i]);
  }

  // Eyes: wide-open & round (thriving) narrowing to fully-shut sad crescents (fading).
  if (i === 0) {
    (
      [[3.5, 6.5], [4.5, 6.5], [5.5, 6.5], [3.5, 7.5], [4.5, 7.5], [5.5, 7.5], [3.5, 8.5], [4.5, 8.5], [5.5, 8.5]] as const
    ).forEach(([c, r]) => P(c, r, WHITE));
    (
      [[9.5, 6.5], [10.5, 6.5], [11.5, 6.5], [9.5, 7.5], [10.5, 7.5], [11.5, 7.5], [9.5, 8.5], [10.5, 8.5], [11.5, 8.5]] as const
    ).forEach(([c, r]) => P(c, r, WHITE));
    P(4.5, 7.5, DARK);
    P(10.5, 7.5, DARK);
    P(3.5, 6.5, '#ddfaff');
    P(11.5, 6.5, '#ddfaff');
  } else if (i === 1) {
    ([[4, 7], [5, 7], [4, 8], [5, 8], [10, 7], [11, 7], [10, 8], [11, 8]] as const).forEach(([c, r]) =>
      P(c, r, WHITE)
    );
    P(5, 8, DARK);
    P(10, 8, DARK);
  } else if (i === 2) {
    (
      [[4.3, 7.6], [5.3, 7.6], [4.3, 8.6], [5.3, 8.6], [9.7, 7.6], [10.7, 7.6], [9.7, 8.6], [10.7, 8.6]] as const
    ).forEach(([c, r]) => P(c, r, WHITE));
    P(4.8, 8.3, DARK);
    P(10.2, 8.3, DARK);
  } else if (i === 3) {
    ([[4.3, 8], [5.3, 8], [9.7, 8], [10.7, 8]] as const).forEach(([c, r]) => P(c, r, WHITE));
    P(4.8, 8.5, DARK);
    P(10.2, 8.5, DARK);
    P(3.8, 7.6, BODY[i]); // heavy lids covering eye tops
    P(10.8, 7.6, BODY[i]);
  } else {
    P(4.3, 8.6, DARK);
    P(5.3, 8.6, DARK);
    P(9.7, 8.6, DARK);
    P(10.7, 8.6, DARK);
  }

  if (i === 0) {
    P(2, 8.5, '#ff7fa8');
    P(13.6, 8.5, '#ff7fa8');
  }

  P(7, 9, BEAK[i]);
  P(8, 9, BEAK[i]);
  P(7, 10, BEAK[i]);
  P(6, 15, BEAK[i]);
  P(9, 15, BEAK[i]);

  return grid;
}

interface Props {
  mood: PetMood;
  size?: number;
}

/** Hoot: a pocket owl that puffs up proud and bright-eyed, or droops soaked under its own rain cloud. */
export function HootFace({ mood, size = 152 }: Props) {
  const t = usePetClock();
  const grid = buildGrid(mood, t);
  return <PixelGrid grid={grid} size={size} />;
}
