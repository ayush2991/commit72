import { PetMood } from '../pet/petHealth';

export type Cell = string | null;
export type Grid = Cell[][];

const SIZE = 16;

export function createGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
}

/** Paints a single grid cell, rounding fractional coordinates and ignoring out-of-bounds ones. */
export function paint(grid: Grid, c: number, r: number, color: string) {
  const cc = Math.round(c);
  const rr = Math.round(r);
  if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) return;
  grid[rr][cc] = color;
}

interface ScaledPaintOpts {
  scale?: number;
  anchorCol?: number;
  anchorRow?: number;
  rowOffset?: number;
  lean?: number;
}

/**
 * Paints a cell through a scale-from-anchor transform (shrink/grow a body around a pivot point)
 * plus a vertical bob offset and a horizontal lean-per-row — the same transform the pixel-art
 * source used to make each creature breathe, sink, and tilt as its mood worsens.
 */
export function paintScaled(grid: Grid, c: number, r: number, color: string, opts: ScaledPaintOpts = {}) {
  const scale = opts.scale ?? 1;
  const anchorCol = opts.anchorCol ?? 7.5;
  const anchorRow = opts.anchorRow ?? 7.5;
  const rowOffset = opts.rowOffset ?? 0;
  const lean = opts.lean ?? 0;
  const rr = anchorRow + (r - anchorRow) * scale;
  const cc = anchorCol + (c - anchorCol) * scale + lean * (rr - anchorRow);
  paint(grid, cc, rr + rowOffset, color);
}

// Per-mood animation constants shared by every pet, indexed 0=thriving..4=fading (best to
// worst) — ported from the design source's vitality curve so every creature breathes,
// sways, and bobs at a consistent rate relative to its own mood.
export const MOOD_ORDER: PetMood[] = ['thriving', 'happy', 'steady', 'worried', 'fading'];
export const VITALITY = [1, 0.78, 0.55, 0.32, 0.12];
export const SWAY_SPEED = [3.2, 2.5, 2.0, 1.6, 1.1];
export const BODY_SCALE = [1.12, 0.98, 0.86, 0.76, 0.62];

export function moodIndex(mood: PetMood): number {
  return MOOD_ORDER.indexOf(mood);
}
