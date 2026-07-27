import { useEffect, useState } from 'react';

const DEFAULT_INTERVAL_MS = 120;

/** Seconds-based clock driving pet idle animation, ticking at a coarse pixel-art frame rate. */
export function usePetClock(intervalMs: number = DEFAULT_INTERVAL_MS): number {
  const [t, setT] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const id = setInterval(() => setT(Date.now() / 1000), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return t;
}
