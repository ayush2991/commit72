export type PetMood = 'fading' | 'worried' | 'steady' | 'happy' | 'thriving';

// Values match the "PactPal" design doc's live prototype (health seed 58,
// +18 on keep, -32 on break, and the mood breakpoints below).
export const PET_HEALTH_DEFAULT = 58;
export const PET_HEALTH_MIN = 0;
export const PET_HEALTH_MAX = 100;

const KEPT_DELTA = 18;
const BROKEN_DELTA = -32;

/**
 * Pip's health is a running score, not a live-window average: keeping a pact
 * nudges it up, letting one expire drags it down hard. No history is stored
 * beyond the two counters — consistent with the rest of the app being
 * in-memory-only today.
 */
export function computeHealth(kept: number, broken: number): number {
  const raw = PET_HEALTH_DEFAULT + kept * KEPT_DELTA + broken * BROKEN_DELTA;
  return Math.max(PET_HEALTH_MIN, Math.min(PET_HEALTH_MAX, raw));
}

export function moodForHealth(health: number): PetMood {
  if (health >= 85) return 'thriving';
  if (health >= 62) return 'happy';
  if (health >= 40) return 'steady';
  if (health >= 18) return 'worried';
  return 'fading';
}

export const PET_MOOD_COPY: Record<PetMood, { label: string; flavor: string }> = {
  fading: { label: 'Fading', flavor: 'Pip is crushed. Broken pacts hurt.' },
  worried: { label: 'Worried', flavor: "Pip is nervous — a pact's running hot." },
  steady: { label: 'Steady', flavor: "Pip is steady. Don't slip now." },
  happy: { label: 'Happy', flavor: 'Pip is happy. Keep the momentum.' },
  thriving: { label: 'Thriving', flavor: 'Pip is glowing — every pact on pace.' },
};
