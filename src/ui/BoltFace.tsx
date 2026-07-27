import { PetMood } from '../pet/petHealth';
import { PixelGrid } from './PixelGrid';
import { BODY_SCALE, createGrid, Grid, moodIndex, paint, paintScaled } from './petPixelGrid';
import { usePetClock } from './usePetClock';

const TOP = ['#94a3b8', '#8f9cae', '#828d9c', '#727986', '#5e636d'];
const BODY = ['#7a8aa0', '#78869a', '#6f7a8a', '#616874', '#4e535c'];
const BOT = ['#5b6a80', '#586475', '#4f5867', '#434955', '#3a3e46'];
const EYE = ['#59f7cf', '#65e6cf', '#8fcfc2', '#c98f8f', '#e04a34'];

function buildGrid(mood: PetMood, t: number): Grid {
  const grid = createGrid();
  const i = moodIndex(mood);
  const sc = BODY_SCALE[i];

  // Levitates with a gentle float when doing well, sinks and leans when broken.
  const levit = i <= 1 ? (Math.sin(t * 2.6) * (i === 0 ? 5 : 3)) / 6 : 0;
  const sink = i >= 3 ? ((i - 2) * 4) / 6 : 0;
  const dy = levit + sink;
  const tilt = i >= 3 ? (i - 2) * 0.06 : 0;
  const P = (c: number, r: number, color: string) =>
    paintScaled(grid, c, r, color, { scale: sc, rowOffset: dy, lean: tilt });

  // Orbiting energy particles when thriving.
  if (i === 0) {
    [0, 1, 2, 3].forEach((k) => {
      const a = t * 2 + k * 1.57;
      paint(grid, 7.5 + Math.cos(a) * 5.5, 8 + Math.sin(a) * 5.5 + dy, '#5cf2c8');
    });
  }

  // Body block.
  for (let r = 4; r <= 13; r++)
    for (let c = 4; c <= 11; c++) P(c, r, r <= 5 ? TOP[i] : r >= 12 ? BOT[i] : BODY[i]);
  // Corner rivets.
  ([[4, 4], [11, 4], [4, 13], [11, 13]] as const).forEach(([c, r]) => P(c, r, BOT[i]));

  // Antenna: upright when good, snapped/drooping stub when bad.
  if (i <= 2) {
    P(7, 3, BODY[i]);
    P(7, 2, i === 0 ? '#5cf2c8' : TOP[i]);
  } else {
    P(7 + (i - 2) * 0.8, 3.3, BODY[i]);
  }

  // Eyes: bright wide circles shrinking to a flat dead line, X'd out when fading.
  const flick = i === 3 && Math.sin(t * 9) > 0.4;
  if (i === 0) {
    ([[5, 6], [6, 6], [5, 7], [6, 7], [9, 6], [10, 6], [9, 7], [10, 7]] as const).forEach(([c, r]) =>
      P(c, r, EYE[i])
    );
    P(5, 6, '#eafffb');
    P(9, 6, '#eafffb');
  } else if (i === 1) {
    ([[5, 7], [6, 7], [5, 8], [6, 8], [9, 7], [10, 7], [9, 8], [10, 8]] as const).forEach(([c, r]) =>
      P(c, r, EYE[i])
    );
  } else if (i === 2) {
    ([[5, 8], [6, 8], [9, 8], [10, 8]] as const).forEach(([c, r]) => P(c, r, EYE[i]));
  } else if (i === 3) {
    ([[5, 8], [6, 8], [9, 8], [10, 8]] as const).forEach(([c, r]) => P(c, r, flick ? BOT[i] : EYE[i]));
    P(5, 7.3, BOT[i]);
    P(10, 7.3, BOT[i]);
  } else {
    P(5, 8, EYE[i]);
    P(6, 9, EYE[i]);
    P(6, 8, EYE[i]);
    P(5, 9, EYE[i]);
    P(9, 8, EYE[i]);
    P(10, 9, EYE[i]);
    P(10, 8, EYE[i]);
    P(9, 9, EYE[i]);
  }

  // Mouth LED: grin, flattening to a jagged crack.
  const mc = i >= 3 ? BOT[i] : EYE[i];
  if (i === 0) {
    P(6, 11, mc);
    P(7, 11.6, mc);
    P(8, 11.6, mc);
    P(9, 11, mc);
  } else if (i === 1) {
    P(6, 11, mc);
    P(7, 11, mc);
    P(8, 11, mc);
    P(9, 11, mc);
  } else if (i === 2) {
    P(6, 11, mc);
    P(7, 11, mc);
    P(8, 11, mc);
  } else if (i === 3) {
    P(6, 11.6, mc);
    P(7, 11, mc);
    P(8, 11, mc);
    P(9, 11.6, mc);
  } else {
    P(6, 11, mc);
    P(7, 12, mc);
    P(8, 10.4, mc);
    P(9, 11, mc);
  }

  // Cracks and sparks when fading.
  if (i === 4) {
    ([[7, 5], [7.4, 6], [8, 6.4], [8, 7], [6.6, 9], [6, 10]] as const).forEach(([c, r]) =>
      P(c, r, '#2c2f36')
    );
    if (Math.sin(t * 7) > 0.6) P(11.5, 5, '#ff6a3a');
  }

  return grid;
}

interface Props {
  mood: PetMood;
  size?: number;
}

/** Bolt: a little rock-bot — levitating with charged cyan eyes, or powered down and sparking. */
export function BoltFace({ mood, size = 152 }: Props) {
  const t = usePetClock();
  const grid = buildGrid(mood, t);
  return <PixelGrid grid={grid} size={size} />;
}
