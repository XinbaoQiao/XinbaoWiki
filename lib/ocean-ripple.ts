/** Shared screen-space wave, retained while the home leave animation crosses routes. */
export const OCEAN_RIPPLE_EVENT = 'site-ocean-ripple';
export type OceanRipple = { x: number; y: number; bornMs: number; waveSpeed: number; durationMs: number };
let active: OceanRipple | null = null;

export function activeOceanRipple(): OceanRipple | null {
  return active && performance.now() - active.bornMs < active.durationMs ? active : null;
}

export function publishOceanRipple(ripple: OceanRipple | null) {
  active = ripple;
  window.dispatchEvent(new CustomEvent(OCEAN_RIPPLE_EVENT, { detail: ripple }));
}

/**
 * Per-crest life envelope shared by leave canvas + ocean click splash paints.
 * n=0 is the leading/outer crest; higher n trails inward. Outer reaches 0 first;
 * inner crests linger and ease out more slowly. lifeT is normalized age in [0, 1].
 */
export function crestOuterFirstExtinction(n: number, lifeT: number): number {
  // Clamp end so the innermost crest soft-lands before the hard lifeT cutoff.
  const end = Math.min(0.98, 0.50 + n * 0.115); // outer ~0.50; deep inner ~0.98
  const start = Math.min(0.30 + n * 0.095, end - 0.12);
  if (lifeT <= start) return 1;
  if (lifeT >= end) return 0;
  const u = (lifeT - start) / Math.max(1e-6, end - start);
  // Higher n -> linger brighter longer, then soft-land (slowly disappear).
  const linger = 1.2 + n * 0.35;
  return 1 - Math.pow(u, linger);
}

