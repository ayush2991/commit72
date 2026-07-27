import { PetMood } from '../pet/petHealth';
import { PixelGrid } from './PixelGrid';
import { BODY_SCALE, createGrid, Grid, moodIndex, paintScaled, VITALITY } from './petPixelGrid';
import { usePetClock } from './usePetClock';

// A potted seedling — grows from a short central stem into a leaf cluster that fans wider and
// blooms when thriving, and droops to a single withered curl when neglected. Scaled around the
// pot's base (row 15) rather than the body center, so the plant shrinks without moving the pot.
const LEAF = ['#43c565', '#5ab35a', '#8fa03a', '#9a7d2e', '#6e5423'];
const POT = '#c8703c';
const POT_SHADE = '#a85a2d';
const RIM = '#d98a52';
const EYE_DARK = '#4a2410';

function buildGrid(mood: PetMood, t: number): Grid {
  const grid = createGrid();
  const i = moodIndex(mood);
  const v = VITALITY[i];
  const sc = BODY_SCALE[i];
  const bob = Math.sin(t * (1.4 + v)) * (1.2 * v + 0.3);
  const P = (c: number, r: number, color: string) => paintScaled(grid, c, r, color, { scale: sc, anchorRow: 15 });

  // Pot.
  for (let r = 12; r <= 15; r++) {
    const inset = r - 12;
    for (let c = 4 + inset; c <= 11 - inset; c++) P(c, r, r >= 14 ? POT_SHADE : POT);
  }
  for (let c = 3; c <= 12; c++) P(c, 12, RIM);

  // Pot face.
  const blink = t % 3.8 < 0.13;
  if (i === 4) {
    P(5, 13.4, EYE_DARK);
    P(6, 13, EYE_DARK);
    P(9, 13, EYE_DARK);
    P(10, 13.4, EYE_DARK);
  } else if (blink) {
    P(6, 13, EYE_DARK);
    P(9, 13, EYE_DARK);
  } else {
    P(6, 13, EYE_DARK);
    P(9, 13, EYE_DARK);
    if (i === 0) {
      P(5, 13, '#fff');
      P(8, 13, '#fff');
    }
  }
  if (i === 3) {
    P(6, 12.4, EYE_DARK);
    P(9, 12.4, EYE_DARK);
  }
  if (i === 0) {
    ([[6, 14], [7, 14], [8, 14], [7, 15]] as const).forEach(([c, r]) => P(c, r, EYE_DARK)); // grin
  } else if (i === 1) {
    P(6, 14, EYE_DARK);
    P(7, 15, EYE_DARK);
    P(8, 14, EYE_DARK); // smile
  } else if (i === 2) {
    P(6, 14, EYE_DARK);
    P(7, 14, EYE_DARK);
    P(8, 14, EYE_DARK); // flat
  } else if (i === 3) {
    P(6, 15, EYE_DARK);
    P(7, 14, EYE_DARK);
    P(8, 15, EYE_DARK); // frown
  } else {
    ([[6, 14], [7, 14], [8, 14], [6, 15], [8, 15]] as const).forEach(([c, r]) => P(c, r, EYE_DARK)); // wail
    P(4, 15, '#7a3f1e');
    P(11, 15, '#7a3f1e');
  }

  // Short central stem — never taller than a stub, so the plant reads as a leaf cluster.
  const stemTop = Math.round(9 + (1 - v) * 1.6);
  const droop = [0, 0, 0.6, 1.8, 3.2][i];
  for (let r = 12; r >= stemTop; r--) P(7.5 + bob * 0.1, r, LEAF[i]);

  // Leaf cluster: a symmetric fan flanking the stem, count and spread shrink as mood worsens.
  const leafPairs = [3, 3, 2, 2, 1][i];
  const spread = [1, 1, 0.8, 0.55, 0.35][i];
  for (let k = 0; k < leafPairs; k++) {
    const lr = stemTop + 1.4 + k * 2.6;
    const reach = (2.6 + k * 1.1) * spread;
    const dside = droop * (0.3 + k * 0.35);
    P(7.5 - reach, lr + dside, LEAF[i]);
    P(7.5 - reach * 0.6, lr - 0.5 + dside * 0.6, LEAF[i]);
    P(7.5 - reach * 0.3, lr + dside * 0.3, LEAF[i]);
    P(7.5 + reach, lr + dside, LEAF[i]);
    P(7.5 + reach * 0.6, lr - 0.5 + dside * 0.6, LEAF[i]);
    P(7.5 + reach * 0.3, lr + dside * 0.3, LEAF[i]);
  }

  // Crown: a rounded flower (thriving) shrinking to a single limp, withered leaf (fading).
  const crownR = stemTop - 0.6;
  if (i === 0) {
    ([[-0.8, 0], [0.8, 0], [0, -0.8], [0, 0.6]] as const).forEach(([dc, dr]) => P(7.5 + dc, crownR + dr, '#ff5f8a'));
    P(7.5, crownR, '#ffd75f');
  } else if (i === 1) {
    P(6.6, crownR, LEAF[i]);
    P(8.4, crownR, LEAF[i]);
    P(7.5, crownR - 0.6, LEAF[i]);
  } else if (i === 2) {
    P(6.8, crownR, LEAF[i]);
    P(8.2, crownR, LEAF[i]);
  } else if (i === 3) {
    P(7.9, crownR + 0.5, LEAF[i]);
  } else {
    P(8.3, crownR + 1.1, LEAF[i]);
  }

  return grid;
}

interface Props {
  mood: PetMood;
  size?: number;
}

/** Sprout: a potted seedling — stands upright and blooms when tended, wilts brown over a cracked pot when neglected. */
export function SproutFace({ mood, size = 152 }: Props) {
  const t = usePetClock();
  const grid = buildGrid(mood, t);
  return <PixelGrid grid={grid} size={size} />;
}
