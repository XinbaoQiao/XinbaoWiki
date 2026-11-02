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
