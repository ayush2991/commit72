import { PetMood } from '../pet/petHealth';
import { PixelGrid } from './PixelGrid';
import { createGrid, Grid, moodIndex, paint, SWAY_SPEED, VITALITY } from './petPixelGrid';
import { usePetClock } from './usePetClock';

// A swaying flame body, tapering and leaning per-row rather than a fixed silhouette — same
// coordinate scheme as PipFace's face placement (rows 6-11 around a body centered on col 7.5).
const OUTER = ['#ff7a14', '#ff9c2e', '#d98a3a', '#b8522e', '#7a2f22'];
const MID = ['#ffc23a', '#ffcf4a', '#e8a94a', '#c46a3a', '#9c4530'];
const CORE = ['#fff2b0', '#ffe58a', '#f3cf8a', '#d99a6a', '#c46a48'];
const EYE_DARK = '#5a2708';

function buildGrid(mood: PetMood, t: number): Grid {
  const grid = createGrid();
  const i = moodIndex(mood);
  const v = VITALITY[i];
  const baseline = 14;

  if (i === 4) {
    // Fading: not a flame at all — a small dying coal on the ground, trailing smoke.
    const cx = 7.5;
    const cy = 12.3 + Math.sin(t * 1.1) * 0.15;
    for (let dr = -2; dr <= 2; dr++) {
      const w = 2.4 - Math.abs(dr) * 0.9;
      for (let dc = -w; dc <= w; dc += 1) paint(grid, cx + dc, cy + dr, OUTER[4]);
    }
    for (let dr = -1; dr <= 1; dr++) {
      const w = 1.1 - Math.abs(dr) * 0.4;
      for (let dc = -w; dc <= w; dc += 1) paint(grid, cx + dc, cy + dr - 0.3, MID[4]);
    }
    const phase = t * 1.1;
    for (let s = 1; s <= 5; s++) {
      const yy = cy - 2 - s * 1.5;
      const xx = cx + Math.sin(phase + s * 0.9) * 1.1;
      paint(grid, xx, yy, 'rgba(150,150,158,0.5)');
    }
    paint(grid, cx - 0.9, cy - 0.4, EYE_DARK);
    paint(grid, cx + 0.9, cy - 0.4, EYE_DARK);
    const dy = (t * 1.2) % 1.4;
    paint(grid, cx - 0.9, cy + 0.3 + dy, '#7fb8e6');
    ([[cx - 0.9, cy + 0.7], [cx, cy + 0.9], [cx + 0.9, cy + 0.7]] as const).forEach(([c, r]) =>
      paint(grid, c, r, EYE_DARK)
    );
    return grid;
  }

  // Squat, jittery, guttering as mood worsens.
  const heightScale = [1, 1, 0.82, 0.55][i];
  const topRow = Math.round(baseline - (baseline - Math.round(3 + (1 - v) * 7.5)) * heightScale);
  const jitter = i === 3 ? Math.sin(t * 11) * 0.6 : 0;
  const widthScale = [1, 0.92, 0.78, 0.6][i];

  for (let r = topRow; r <= baseline; r++) {
    const frac = (r - topRow) / Math.max(1, baseline - topRow);
    const halfW =
      (0.7 + Math.sin(frac * Math.PI * 0.82) * 4.2 * (0.55 + 0.45 * v)) * widthScale +
      (i === 3 ? jitter * frac : 0);
    const sway = Math.sin(t * SWAY_SPEED[i] + frac * 3) * (2.2 * v + 0.4) * (1 - frac);
    const center = 7.5 + sway;
    for (let c = Math.floor(center - halfW); c <= Math.ceil(center + halfW); c++) paint(grid, c, r, OUTER[i]);
    const mw = halfW - 1.4;
    if (mw > 0) for (let c = Math.floor(center - mw); c <= Math.ceil(center + mw); c++) paint(grid, c, r, MID[i]);
    const cw = halfW - 2.8;
    if (cw > 0 && frac > 0.35 && i <= 1)
      for (let c = Math.floor(center - cw); c <= Math.ceil(center + cw); c++) paint(grid, c, r, CORE[i]);
  }

  const faceR = topRow + 5.2 * heightScale;
  const blink = t % 3.6 < 0.13;
  if (blink) {
    paint(grid, 6, faceR, EYE_DARK);
    paint(grid, 9, faceR, EYE_DARK);
  } else {
    ([[6, faceR], [6, faceR + 1], [9, faceR], [9, faceR + 1]] as const).forEach(([c, r]) =>
      paint(grid, c, r, EYE_DARK)
    );
    if (i === 0) {
      paint(grid, 6, faceR, '#fff2b0');
      paint(grid, 9, faceR, '#fff2b0');
    }
  }
  if (i === 3) {
    paint(grid, 6, faceR - 1, EYE_DARK);
    paint(grid, 9, faceR - 1, EYE_DARK);
  }

  if (i === 0) {
    ([[6, faceR + 3], [7, faceR + 3], [8, faceR + 3], [7, faceR + 4]] as const).forEach(([c, r]) =>
      paint(grid, c, r, '#7a2d10')
    );
  } else if (i === 1) {
    paint(grid, 6, faceR + 3, EYE_DARK);
    paint(grid, 7, faceR + 4, EYE_DARK);
    paint(grid, 8, faceR + 3, EYE_DARK);
  } else if (i === 2) {
    paint(grid, 6, faceR + 3, EYE_DARK);
    paint(grid, 7, faceR + 3, EYE_DARK);
    paint(grid, 8, faceR + 3, EYE_DARK);
  } else {
    paint(grid, 6, faceR + 4, EYE_DARK);
    paint(grid, 7, faceR + 3, EYE_DARK);
    paint(grid, 8, faceR + 4, EYE_DARK);
    paint(grid, 10.3, faceR - 0.6, '#7fb8e6');
  }

  return grid;
}

interface Props {
  mood: PetMood;
  size?: number;
}

/** Ember: a living streak-flame that sways and burns tall and gold, or gutters to a dying coal. */
export function EmberFace({ mood, size = 152 }: Props) {
  const t = usePetClock();
  const grid = buildGrid(mood, t);
  return <PixelGrid grid={grid} size={size} />;
}
