/**
 * Fish-school personality presets for clean-room character ocean.
 * Couzin-style weight mixes (polarised / swarm / mill), original values.
 * Zone weights follow Couzin et al. 2002 as used by jiezi1234/character-ocean
 * (via stackedlol/ascii-sharks): strong align -> polarised ribbons, low align ->
 * swarm, tangential mill -> bait ball.
 */

export type FishSpecies = {
  name: string;
  cruise: number;
  maxSpeed: number;
  minSpeed: number;
  weight: number;
  schoolSize: [number, number];
  /** Personal space in grid cells (x, y). */
  spacing: [number, number];
  align: number;
  cohesion: number;
  jitter: number;
  /** Tangential mill around school centre. */
  mill: number;
  verticalDrag: number;
};

export const SPECIES: FishSpecies[] = [
  {
    name: 'sardine',
    cruise: 36, maxSpeed: 64, minSpeed: 18, weight: 3,
    schoolSize: [56, 88], spacing: [1.75, 1.15],
    align: 1.7, cohesion: 1.8, jitter: 32, mill: 70, verticalDrag: 0.45,
  },
  {
    name: 'anchovy',
    cruise: 46, maxSpeed: 78, minSpeed: 22, weight: 3,
    schoolSize: [60, 96], spacing: [1.55, 1.1],
    align: 2.4, cohesion: 1.55, jitter: 26, mill: 0, verticalDrag: 1.25,
  },
  {
    name: 'silverside',
    cruise: 40, maxSpeed: 70, minSpeed: 20, weight: 3,
    schoolSize: [48, 72], spacing: [1.9, 1.2],
    align: 2.0, cohesion: 1.65, jitter: 28, mill: 12, verticalDrag: 1.35,
  },
  {
    name: 'mackerel',
    cruise: 32, maxSpeed: 60, minSpeed: 16, weight: 2,
    schoolSize: [32, 52], spacing: [2.3, 1.3],
    align: 1.9, cohesion: 1.4, jitter: 22, mill: 0, verticalDrag: 1.7,
  },
  {
    name: 'goby',
    cruise: 26, maxSpeed: 56, minSpeed: 10, weight: 1,
    schoolSize: [28, 44], spacing: [1.55, 1.2],
    align: 1.0, cohesion: 1.55, jitter: 48, mill: 0, verticalDrag: 0.35,
  },
];

const TOTAL_WEIGHT = SPECIES.reduce((sum, s) => sum + s.weight, 0);

export function pickSpecies() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < SPECIES.length; i++) {
    r -= SPECIES[i]!.weight;
    if (r <= 0) return i;
  }
  return 0;
}