/**
 * Clean-room artificial-life ocean for XinbaoWiki.
 *
 * Observed jiezi1234/character-ocean / ascii-sharks *behavior* (spine sharks,
 * Couzin-zone schools, soft currents, pointer splash) reimplemented here.
 * Not a paste of unlicensed engine|world|renderer|species|math sources —
 * see README.md / LICENSE notes.
 */

import { angleDiff, clamp, current, rand, randInt, TAU } from '@/lib/character-ocean/math';
import { pickSpecies, SPECIES } from '@/lib/character-ocean/species';

export const SHARK_NODES = 20;

export type SharkKind =
  | 'classic'
  | 'hammerhead'
  | 'tiger'
  | 'zebra'
  | 'greathammer'
  | 'mako'
  | 'thresher'
  | 'nurse'
  | 'manta'
  | 'whaleshark'
  | 'sunfish';

export type SharkSpec = { kind: SharkKind; size: number };

/** Modest on-screen cast (6). Full SharkKind set still cycles in on edge exit. */
const DEFAULT_SHARKS: SharkSpec[] = [
  { kind: 'classic', size: 1 },
  { kind: 'tiger', size: 0.95 },
  { kind: 'hammerhead', size: 0.9 },
  { kind: 'manta', size: 1.05 },
  { kind: 'mako', size: 0.88 },
  { kind: 'thresher', size: 1.0 },
];

/** Full cast — on-screen sharks cycle through these when they leave the frame. */
export const ALL_SHARK_KINDS: SharkKind[] = [
  'classic',
  'hammerhead',
  'tiger',
  'zebra',
  'greathammer',
  'mako',
  'thresher',
  'nurse',
  'manta',
  'whaleshark',
  'sunfish',
];

export const KIND_SIZE: Record<SharkKind, number> = {
  classic: 1,
  hammerhead: 0.92,
  tiger: 0.95,
  zebra: 0.9,
  greathammer: 1.05,
  mako: 0.88,
  thresher: 1.08,
  nurse: 0.95,
  manta: 1.05,
  whaleshark: 1.2,
  sunfish: 0.85,
};

export type Fish = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  species: number;
  alarm: number;
  alive: boolean;
  respawnAt: number;
  phase: number;
  turn: number;
  depth: number;
  millDir: 1 | -1;
};

export type Shark = {
  id: number;
  kind: SharkKind;
  length: number;
  nodes: Float32Array;
  heading: number;
  speed: number;
  phase: number;
  turn: number;
  wander: number;
  orbitDir: 1 | -1;
  orbitRadius: number;
  depth: number;
  /** 0..1 leftover of sprint spike; multiplies cruise while decaying. */
  rippleBoost: number;
  /** Bitmask / stamp of last ripple bornMs that already fired a spike (edge). */
  rippleHitStamp: number;
};

/** Shared with engine ripple paint so hit-test matches the visible ring. */
export const RIPPLE_WAVE_SPEED = 108; // px/s leading front
export const RIPPLE_DURATION_MS = 3400;
/**
 * On ring contact: sprint toward cruise * RIPPLE_SPEED_CAP (hard ceiling).
 * Re-hits refresh toward the cap but never stack past it. Speed-only.
 */
export const RIPPLE_SPEED_CAP = 4;
/** Addend so (1 + peak) == RIPPLE_SPEED_CAP when boost=1. */
export const RIPPLE_BOOST_PEAK = RIPPLE_SPEED_CAP - 1;
/** Seconds for rippleBoost 1 → 0 (slow coast-down after the sprint spike). */
export const RIPPLE_BOOST_DECAY_S = 3.6;
/** Only slam to cap when leftover boost is below this (spam re-hits only refresh decay). */
export const RIPPLE_SPIKE_GATE = 0.28;

export type WorldEvent = { kind: 'splash'; x: number; y: number };
export type SplashRipple = { x: number; y: number; bornMs: number };

const FISH_SEPARATION_K = 380;
const FISH_ALIGN_K = 2.05;
const FISH_COHESION_K = 2.15;
const FISH_FLEE_K = 1100;
const BLIND_COS = -0.55;

export class World {
  width = 0;
  height = 0;
  time = 0;
  fish: Fish[] = [];
  sharks: Shark[] = [];
  events: WorldEvent[] = [];
  /** Active click ripples (wall-clock) — expand at RIPPLE_WAVE_SPEED for shark hits. */
  ripples: SplashRipple[] = [];
  pointer = { x: 0, y: 0, active: false };

  private perception = 60;
  private sepX: number[] = [];
  private sepY: number[] = [];
  private foreignSep = 40;
  private bucketCols = 0;
  private bucketRows = 0;
  private bucketHead = new Int32Array(0);
  private bucketNext = new Int32Array(0);
  private lastSpawn = 0;
  private tmp = { x: 0, y: 0 };
  private mobile = false;
  private density = 1;
  private allowedKinds: SharkKind[] = [...ALL_SHARK_KINDS];

  constructor(
    private sharkSpecs: SharkSpec[] = DEFAULT_SHARKS,
    private fishCount?: number,
  ) {}

  setMobile(mobile: boolean) {
    this.mobile = mobile;
  }

  setDensity(density: number) {
    const next = Number.isFinite(density) ? Math.min(2, Math.max(0.35, density)) : 1;
    if (Math.abs(next - this.density) < 0.001) return;
    this.density = next;
    this.rebuildSharkSpecs();
    if (this.width > 0 && this.height > 0) {
      this.fish = [];
      this.seed();
    }
  }

  setAllowedKinds(kinds: SharkKind[]) {
    const next = kinds.length ? [...new Set(kinds)] : DEFAULT_SHARKS.map((s) => s.kind);
    const same =
      next.length === this.allowedKinds.length &&
      next.every((k) => this.allowedKinds.includes(k));
    if (same) return;
    this.allowedKinds = next;
    this.rebuildSharkSpecs();
    if (this.width > 0 && this.height > 0) {
      this.fish = [];
      this.seed();
    }
  }

  private rebuildSharkSpecs() {
    const preferred = DEFAULT_SHARKS.map((s) => s.kind).filter((k) =>
      this.allowedKinds.includes(k),
    );
    const rest = this.allowedKinds.filter((k) => !preferred.includes(k));
    const ordered = [...preferred, ...rest];
    const pool = ordered.length ? ordered : DEFAULT_SHARKS.map((s) => s.kind);
    // Cast size follows density only — reuse/cycle selected kinds to fill slots.
    const baseCast = this.mobile ? 2 : 6;
    const cast = clamp(
      Math.round(baseCast * this.density),
      this.mobile ? 1 : 2,
      this.mobile ? 3 : 10,
    );
    this.sharkSpecs = Array.from({ length: cast }, (_, i) => {
      const kind = pool[i % pool.length]!;
      return { kind, size: KIND_SIZE[kind] ?? 1 };
    });
  }

  resize(width: number, height: number, cellW: number, cellH: number) {
    const first = this.width === 0;
    this.width = width;
    this.height = height;
    this.sepX = SPECIES.map((sp) => sp.spacing[0] * cellW);
    this.sepY = SPECIES.map((sp) => sp.spacing[1] * cellH);
    // Perception must exceed school seed radius or Couzin never sees neighbours.
    this.perception = Math.max(cellH * 7, cellW * 14, 120);
    this.foreignSep = cellW * 2.4;

    if (first || this.fish.length === 0) {
      this.seed();
      return;
    }
    for (const f of this.fish) {
      f.x = clamp(f.x, 0, width);
      f.y = clamp(f.y, 0, height);
    }
  }

  seed() {
    const { width: W, height: H } = this;
    const minSide = Math.min(W, H);
    // Mobile: leave alone. Desktop: mid size — smaller than the old huge recreate,
    // large enough that head/body/fin/tail still read as a shark silhouette.
    const baseLength = this.mobile
      ? clamp(minSide * 0.24, 70, 132)
      : clamp(minSide * 0.40, 160, 340);
    let specs = this.sharkSpecs;
    if (this.mobile) {
      specs = specs.slice(0, 2).map((s, i) => ({
        ...s,
        size: s.size * (i === 0 ? 0.78 : 0.62),
      }));
    }

    this.sharks = [];
    for (let i = 0; i < specs.length; i++) {
      const { kind, size } = specs[i]!;
      const length = baseLength * size;
      // Patrol ring near the frame — keep sharks out of the centre text band.
      const orbitRadius = minSide * rand(0.42, 0.58);
      const a = (i / Math.max(1, specs.length)) * TAU + rand(-0.4, 0.4);
      const orbitDir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      const x = W / 2 + Math.cos(a) * orbitRadius * (W / minSide) * 0.9;
      const y = H / 2 + Math.sin(a) * orbitRadius;
      const heading = a + (orbitDir * Math.PI) / 2;
      const nodes = new Float32Array(SHARK_NODES * 2);
      const seg = length / (SHARK_NODES - 1);
      for (let n = 0; n < SHARK_NODES; n++) {
        nodes[n * 2] = x - Math.cos(heading) * seg * n;
        nodes[n * 2 + 1] = y - Math.sin(heading) * seg * n;
      }
      this.sharks.push({
        id: i + 1,
        kind,
        length,
        nodes,
        heading,
        speed: 30,
        phase: rand(0, TAU),
        turn: 0,
        wander: 0,
        orbitDir,
        orbitRadius,
        depth: size,
        rippleBoost: 0,
        rippleHitStamp: 0,
      });
    }
    this.sharks.sort((a, b) => a.length - b.length);

    // Modest school totals — desktop especially sparse so sharks can read.
    // Density is intentionally steep so the settings slider is obvious.
    const dens = this.density;
    // Bigger school presence via COUNT (not individual size): denser caps, still soft-fade under text.
    // Fewer separate schools: keep a modest total while species.schoolSize is high
    // so each group packs denser (user: 鱼群数量少、每个鱼群鱼多).
    const areaCap = this.mobile
      ? clamp(Math.round(((W * H) / 12000) * (0.45 + dens * dens * 0.9)), 14, 110)
      : clamp(Math.round(((W * H) / 9000) * (0.5 + dens * dens * 1.35)), 40, 240);
    const total = this.fishCount ?? areaCap;
    this.fish = [];
    while (this.fish.length < total) {
      const species = pickSpecies();
      const sp = SPECIES[species]!;
      const size = Math.min(randInt(sp.schoolSize[0], sp.schoolSize[1]), total - this.fish.length);
      const millDir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      // Seed schools in the margin corridors so they start around the page, not on the headline.
      const band = randInt(0, 3);
      let cx: number;
      let cy: number;
      if (band === 0) {
        cx = rand(W * 0.04, W * 0.22);
        cy = rand(H * 0.08, H * 0.92);
      } else if (band === 1) {
        cx = rand(W * 0.78, W * 0.96);
        cy = rand(H * 0.08, H * 0.92);
      } else if (band === 2) {
        cx = rand(W * 0.08, W * 0.92);
        cy = rand(H * 0.04, H * 0.22);
      } else {
        cx = rand(W * 0.08, W * 0.92);
        cy = rand(H * 0.78, H * 0.96);
      }
      // Prefer tangential cruise along the edge they spawned on.
      const dir =
        band === 0 || band === 1
          ? (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2) + rand(-0.35, 0.35)
          : (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.35, 0.35);
      for (let k = 0; k < size; k++) {
        this.fish.push({
          // Loose seed cloud — still within perception so Couzin links, but not a packed blob.
          x: cx + rand(-1, 1) * Math.min(this.perception * 0.72, this.sepX[species]! * 4.2),
          y: cy + rand(-1, 1) * Math.min(this.perception * 0.55, this.sepY[species]! * 3.4),
          vx: Math.cos(dir) * sp.cruise,
          vy: Math.sin(dir) * sp.cruise,
          species,
          alarm: 0,
          alive: true,
          respawnAt: 0,
          phase: rand(0, TAU),
          turn: 0,
          depth: rand(0.55, 1),
          millDir,
        });
      }
    }
    this.bucketNext = new Int32Array(this.fish.length);
  }

  splash(x: number, y: number) {
    this.events.push({ kind: 'splash', x, y });
    // Wall-clock birth so expanding front stays locked to the painted ripple.
    this.ripples.push({ x, y, bornMs: performance.now() });
    while (this.ripples.length > 4) this.ripples.shift();
    // Stronger local impulse so the school visibly parts under a click ripple.
    // Big fish (sharks) are not velocity-impulsed here — ring contact raises cruise
    // (applyRippleBoosts) and stepSharks steers them away from the epicenter.
    const r = 280;
    for (const f of this.fish) {
      if (!f.alive) continue;
      const dx = f.x - x;
      const dy = f.y - y;
      const d = Math.hypot(dx, dy);
      if (d > r || d < 1e-3) continue;
      const k = (1 - d / r) * 340;
      f.vx += (dx / d) * k;
      f.vy += (dy / d) * k;
      f.alarm = Math.min(1, f.alarm + 0.85);
    }
  }

  step(dt: number) {
    this.time += dt;
    this.rebuildHash();
    this.applyRippleBoosts(dt);
    this.stepFish(dt);
    this.stepSharks(dt);
    this.respawn();
    if (this.events.length > 12) this.events.splice(0, this.events.length - 12);
  }

  /** When a painted ripple ring crosses a shark body, raise cruise briefly. */
  private applyRippleBoosts(dt: number) {
    const now = performance.now();
    this.ripples = this.ripples.filter((r) => now - r.bornMs < RIPPLE_DURATION_MS);
    for (const sh of this.sharks) {
      // Slow coast-down of leftover sprint energy.
      if (sh.rippleBoost > 0) {
        sh.rippleBoost = Math.max(0, sh.rippleBoost - dt / RIPPLE_BOOST_DECAY_S);
      }
      if (this.ripples.length === 0) continue;
      const nodes = sh.nodes;
      const L = sh.length;
      const band = Math.max(22, L * 0.14);
      const gentle =
        sh.kind === 'manta' || sh.kind === 'whaleshark' || sh.kind === 'sunfish';
      const pace = sh.kind === 'sunfish' ? 0.63 : gentle ? 0.8 : 1;
      const baseCruise = (30 + L * 0.04) * pace;
      for (const r of this.ripples) {
        // One sprint spike per ripple per shark (edge), not continuous re-bump while ring sweeps.
        if (r.bornMs === sh.rippleHitStamp) continue;
        const front = RIPPLE_WAVE_SPEED * ((now - r.bornMs) / 1000);
        if (front < 4) continue;
        let hit = false;
        for (let k = 0; k < SHARK_NODES; k += 2) {
          const dx = nodes[k * 2]! - r.x;
          const dy = nodes[k * 2 + 1]! - r.y;
          const d = Math.hypot(dx, dy);
          if (Math.abs(d - front) <= band) {
            hit = true;
            break;
          }
        }
        if (!hit) continue;
        sh.rippleHitStamp = r.bornMs;
        const capped = baseCruise * RIPPLE_SPEED_CAP;
        // Cold / near-cruise: one readable sprint spike.
        // Already sprinting: only refresh decay so spam-clicks stay smooth (no speed slam).
        if (sh.rippleBoost < RIPPLE_SPIKE_GATE) {
          sh.speed = Math.min(capped, Math.max(sh.speed, capped));
        } else {
          // Soft pull toward cap — continuous under rapid re-hits.
          sh.speed += (capped - sh.speed) * 0.06;
          if (sh.speed > capped) sh.speed = capped;
        }
        sh.rippleBoost = 1;
      }
    }
  }

  private rebuildHash() {
    const size = this.perception;
    const pad = 2;
    this.bucketCols = Math.ceil(this.width / size) + pad * 2;
    this.bucketRows = Math.ceil(this.height / size) + pad * 2;
    const n = this.bucketCols * this.bucketRows;
    if (this.bucketHead.length !== n) {
      this.bucketHead = new Int32Array(n);
    }
    this.bucketHead.fill(-1);
    if (this.bucketNext.length !== this.fish.length) {
      this.bucketNext = new Int32Array(this.fish.length);
    }
    for (let i = 0; i < this.fish.length; i++) {
      const f = this.fish[i]!;
      if (!f.alive) continue;
      const b = this.bucketOf(f.x, f.y);
      this.bucketNext[i] = this.bucketHead[b]!;
      this.bucketHead[b] = i;
    }
  }

  private bucketOf(x: number, y: number) {
    const size = this.perception;
    const c = clamp(Math.floor(x / size) + 2, 0, this.bucketCols - 1);
    const r = clamp(Math.floor(y / size) + 2, 0, this.bucketRows - 1);
    return r * this.bucketCols + c;
  }

  private stepFish(dt: number) {
    const { fish, sharks, pointer, width: W, height: H, time } = this;
    const R = this.perception;
    const R2 = R * R;
    const foreignSep = this.foreignSep;
    const size = this.perception;
    const cols = this.bucketCols;
    const rows = this.bucketRows;
    const head = this.bucketHead;
    const next = this.bucketNext;
    const cur = this.tmp;
    const calmDecay = Math.exp(-dt * 0.7);
    const contagion = Math.min(1, dt * 6);

    for (let i = 0; i < fish.length; i++) {
      const f = fish[i]!;
      if (!f.alive) continue;
      const sp = SPECIES[f.species]!;
      const spread = 1 + 1.8 * f.alarm;
      const sepX = this.sepX[f.species]! * spread;
      const sepY = this.sepY[f.species]! * spread;

      const speed = Math.hypot(f.vx, f.vy) || 1;
      const hx = f.vx / speed;
      const hy = f.vy / speed;

      let ax = 0;
      let ay = 0;
      let sx = 0;
      let sy = 0;
      let avx = 0;
      let avy = 0;
      let cx = 0;
      let cy = 0;
      let n = 0;
      let neighbourAlarm = 0;

      // Couzin-style zones (Couzin et al. 2002 via jiezi/ascii-sharks):
      // repulsion inside elliptical personal space, then alignment+cohesion
      // with a rear blind spot (~127 deg). Relative offsets match the paper model.
      const bc = clamp(Math.floor(f.x / size) + 2, 0, cols - 1);
      const br = clamp(Math.floor(f.y / size) + 2, 0, rows - 1);
      for (let r = Math.max(0, br - 1); r <= Math.min(rows - 1, br + 1); r++) {
        for (let c = Math.max(0, bc - 1); c <= Math.min(cols - 1, bc + 1); c++) {
          let j = head[r * cols + c]!;
          while (j !== -1) {
            if (j !== i) {
              const o = fish[j]!;
              if (o.alive) {
                const dx = o.x - f.x;
                const dy = o.y - f.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < R2 && d2 > 1e-6) {
                  const d = Math.sqrt(d2);
                  if ((dx * hx + dy * hy) / d > BLIND_COS) {
                    const qx = dx / sepX;
                    const qy = dy / sepY;
                    const q2 = qx * qx + qy * qy;
                    if (q2 < 1) {
                      const q = Math.sqrt(q2) || 1e-3;
                      const k = (1 - q) / q;
                      sx -= qx * k;
                      sy -= qy * k;
                    }
                    if (o.species === f.species) {
                      avx += o.vx;
                      avy += o.vy;
                      cx += dx;
                      cy += dy;
                      n++;
                    } else if (d < foreignSep) {
                      const k = ((1 - d / foreignSep) / d) * 0.6;
                      sx -= dx * k;
                      sy -= dy * k;
                    }
                    if (o.alarm > neighbourAlarm) neighbourAlarm = o.alarm;
                  }
                }
              }
            }
            j = next[j]!;
          }
        }
      }

      ax += sx * FISH_SEPARATION_K;
      ay += sy * FISH_SEPARATION_K;
      if (n > 0) {
        const alignK = FISH_ALIGN_K * sp.align;
        const cohesionK = FISH_COHESION_K * sp.cohesion * (1 - 0.8 * f.alarm);
        ax += (avx / n - f.vx) * alignK + (cx / n) * cohesionK;
        ay += (avy / n - f.vy) * alignK + (cy / n) * cohesionK;
        if (sp.mill > 0) {
          const cl = Math.hypot(cx, cy) || 1;
          ax += (-cy / cl) * f.millDir * sp.mill * (1 - f.alarm);
          ay += (cx / cl) * f.millDir * sp.mill * (1 - f.alarm);
        }
      }

      // Fear from nearest point on the front half of each shark spine (fountain split).
      let fear = 0;
      for (const sh of sharks) {
        const fearR = sh.length * 0.6 + 60;
        let best = Infinity;
        let bx = 0;
        let by = 0;
        for (let k = 0; k <= 12; k += 3) {
          const nx = sh.nodes[k * 2]!;
          const ny = sh.nodes[k * 2 + 1]!;
          const d2 = (f.x - nx) ** 2 + (f.y - ny) ** 2;
          if (d2 < best) {
            best = d2;
            bx = nx;
            by = ny;
          }
        }
        const d = Math.sqrt(best);
        if (d >= fearR || d < 1e-3) continue;
        let w = 1 - d / fearR;
        w *= w;
        const awayX = (f.x - bx) / d;
        const awayY = (f.y - by) / d;
        const shx = Math.cos(sh.heading);
        const shy = Math.sin(sh.heading);
        const side = shx * (f.y - sh.nodes[1]!) - shy * (f.x - sh.nodes[0]!) >= 0 ? 1 : -1;
        ax += (awayX * 0.7 - shy * side * 0.9) * FISH_FLEE_K * w;
        ay += (awayY * 0.7 + shx * side * 0.9) * FISH_FLEE_K * w;
        fear = Math.max(fear, Math.sqrt(w));
      }

      if (pointer.active) {
        const pr = 130;
        const dx = f.x - pointer.x;
        const dy = f.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < pr && d > 1e-3) {
          const w = (1 - d / pr) ** 2;
          ax += (dx / d) * FISH_FLEE_K * w;
          ay += (dy / d) * FISH_FLEE_K * w;
          fear = Math.max(fear, Math.sqrt(w) * 0.8);
        }
      }

      let alarm = Math.max(f.alarm * calmDecay, fear);
      const relayed = neighbourAlarm * 0.86;
      if (relayed > alarm) alarm += (relayed - alarm) * contagion;
      f.alarm = alarm;

      // Push schools out of the centre text ellipse toward the margin corridors.
      {
        const ex = (f.x - W * 0.5) / (W * 0.34);
        const ey = (f.y - H * 0.5) / (H * 0.24);
        const e2 = ex * ex + ey * ey;
        if (e2 < 1) {
          const e = Math.sqrt(e2) || 1e-3;
          const w = (1 - e) * 4.2 * (1 - 0.55 * f.alarm);
          ax += (ex / e) * w;
          ay += (ey / e) * w;
        }
      }
      // Prefer a margin ring: if deep inside, bias outward; near rim, cruise tangentially.
      {
        const nx = (f.x - W * 0.5) / (W * 0.5);
        const ny = (f.y - H * 0.5) / (H * 0.5);
        const nr = Math.hypot(nx, ny) || 1e-3;
        const target = 0.78;
        // Mild radial bias — strong values tear schools into loners.
        const radial = (target - nr) * 1.15;
        ax += (nx / nr) * radial;
        ay += (ny / nr) * radial;
        // Tangential mill around the page when near the preferred ring.
        if (nr > 0.55) {
          const tw = clamp((nr - 0.55) / 0.35, 0, 1) * 2.35 * (1 - 0.7 * f.alarm);
          ax += (-ny / nr) * f.millDir * tw;
          ay += (nx / nr) * f.millDir * tw;
        }
      }
      const m = 36;
      // Soft rim only; stronger forces would trap schools and block species cycling.
      if (f.x < m) ax += (m - f.x) * 1.6;
      else if (f.x > W - m) ax -= (f.x - (W - m)) * 1.6;
      if (f.y < m) ay += (m - f.y) * 1.6;
      else if (f.y > H - m) ay -= (f.y - (H - m)) * 1.6;

      current(f.x, f.y, time, cur);
      ax += cur.x * 0.5 + (Math.random() - 0.5) * sp.jitter;
      ay += cur.y * 0.5 + (Math.random() - 0.5) * sp.jitter;
      ay -= f.vy * sp.verticalDrag * (1 - 0.7 * f.alarm);

      const preferred = sp.cruise * (1 + 1.3 * f.alarm);
      ax += (preferred - speed) * hx * 1.6;
      ay += (preferred - speed) * hy * 1.6;

      const before = Math.atan2(f.vy, f.vx);
      f.vx += ax * dt;
      f.vy += ay * dt;
      const maxSpeed = sp.maxSpeed * (1 + 1.8 * f.alarm);
      const s = Math.hypot(f.vx, f.vy);
      if (s > maxSpeed) {
        f.vx *= maxSpeed / s;
        f.vy *= maxSpeed / s;
      } else if (s < sp.minSpeed && s > 1e-3) {
        f.vx *= sp.minSpeed / s;
        f.vy *= sp.minSpeed / s;
      }
      f.turn += (angleDiff(before, Math.atan2(f.vy, f.vx)) / dt - f.turn) * Math.min(1, dt * 8);
      f.phase += dt * (7 + Math.hypot(f.vx, f.vy) * 0.12);
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      // Far past the rim (after edgeFade has already gone to ~0) → despawn + species cycle.
      const leave = Math.max(160, Math.min(W, H) * 0.18);
      if (f.x < -leave || f.x > W + leave || f.y < -leave || f.y > H + leave) {
        f.alive = false;
        f.respawnAt = time + rand(1.6, 6.5);
      }
    }
  }

  private stepSharks(dt: number) {
    const { sharks, width: W, height: H, time } = this;
    const minSide = Math.min(W, H);
    const cxW = W / 2;
    const cyW = H / 2;

    for (const sh of sharks) {
      const L = sh.length;
      const nodes = sh.nodes;
      const hx = nodes[0]!;
      const hy = nodes[1]!;

      let dx = Math.cos(sh.heading);
      let dy = Math.sin(sh.heading);

      // Soft wander ahead of the snout (ref: wander dt*3.2, amp 0.45)
      sh.wander = clamp(sh.wander + (Math.random() - 0.5) * dt * 3.2, -1.1, 1.1);
      dx += Math.cos(sh.heading + sh.wander) * 0.45;
      dy += Math.sin(sh.heading + sh.wander) * 0.45;

      // Click ripples: keep the sprint boost, but steer AWAY from the epicenter.
      // Cap influence (modest ring reach) and brake when still aimed inward so the
      // 4x surge cannot charge through the center before the turn catches up.
      // Small fish keep splash() impulse only.
      {
        const now = performance.now();
        const reachCap = Math.min(W, H) * 0.36;
        for (const ripple of this.ripples) {
          const age = (now - ripple.bornMs) / 1000;
          if (age < 0 || age * 1000 > RIPPLE_DURATION_MS) continue;
          const front = Math.max(24, RIPPLE_WAVE_SPEED * age);
          const rx = hx - ripple.x;
          const ry = hy - ripple.y;
          const d = Math.hypot(rx, ry) || 1e-3;
          const reach = Math.min(Math.max(front * 1.08, L * 0.75), reachCap);
          if (d >= reach) continue;
          const ox = rx / d;
          const oy = ry / d;
          const nearCore = d < Math.max(72, L * 0.5);
          const crestBand = Math.max(40, L * 0.22);
          const nearCrest = Math.abs(d - front) <= crestBand;
          if (!nearCore && !nearCrest) continue;
          const falloff = nearCore
            ? 1 - d / Math.max(72, L * 0.5)
            : 1 - Math.abs(d - front) / crestBand;
          let urgency = Math.max(0, falloff) * Math.max(0, falloff) * (1.2 + 1.45 * sh.rippleBoost);
          // Heading into the epicenter (against outward) → stronger flee + soft brake.
          const inward = Math.cos(sh.heading) * -ox + Math.sin(sh.heading) * -oy;
          if (inward > 0.08) {
            urgency *= 1.55 + inward * 0.9;
            if (d < front * 0.92 || nearCore) {
              sh.speed *= 1 - Math.min(0.32, inward * 0.28);
            }
          }
          dx += ox * urgency * 2.55;
          dy += oy * urgency * 2.55;
        }
      }

      // Periphery patrol ring — larger radius keeps bodies in the margins.
      const rx = (hx - cxW) / (W / minSide);
      const ry = hy - cyW;
      const r = Math.hypot(rx, ry) || 1;
      const radius = sh.orbitRadius * (1 + 0.12 * Math.sin(time * 0.05 + sh.id));
      const radial = clamp((radius - r) / radius, -1, 1);
      // Stronger tangential + radial hold than the mid-page orbit (ref *0.55 → *0.85).
      dx += ((-ry / r) * sh.orbitDir + (rx / r) * radial * 1.15) * 0.85;
      dy += ((rx / r) * sh.orbitDir + (ry / r) * radial * 1.15) * 0.85;

      // Keep clear of siblings (ref: range (L+other)*0.45, weight *3)
      for (const other of sharks) {
        if (other === sh) continue;
        for (let k = 0; k < SHARK_NODES; k += 4) {
          const ox = hx - other.nodes[k * 2]!;
          const oy = hy - other.nodes[k * 2 + 1]!;
          const d = Math.hypot(ox, oy);
          const range = (L + other.length) * 0.45;
          if (d < range && d > 1e-3) {
            const w = (1 - d / range) * 3;
            dx += (ox / d) * w;
            dy += (oy / d) * w;
          }
        }
      }

      // Expanded elliptical no-swim over the centre text (ref W*0.3/H*0.16, stronger here).
      const ex = (hx - cxW) / (W * 0.38);
      const ey = (hy - cyW) / (H * 0.26);
      const e2 = ex * ex + ey * ey;
      if (e2 < 1) {
        const e = Math.sqrt(e2) || 1e-3;
        const w = (1 - e) * 4.2;
        dx += (ex / e) * w;
        dy += (ey / e) * w;
      }

      // Soft rim: prefer tangential slide along the frame so they circle the page;
      // still allow full exit so species can cycle on re-entry.
      const over = Math.max(-hx, hx - W, -hy, hy - H);
      if (over > -L * 0.25 && over < L * 0.1) {
        const w = clamp((over + L * 0.25) / (L * 0.5), 0, 1);
        // Tangential along nearest edge.
        const alongX = Math.abs(hx - cxW) > Math.abs(hy - cyW) ? 0 : sh.orbitDir;
        const alongY = Math.abs(hx - cxW) > Math.abs(hy - cyW) ? sh.orbitDir : 0;
        dx += alongX * w * 1.4;
        dy += alongY * w * 1.4;
        // Mild inward only when clearly past the lip — keep bodies dipping off-screen.
        if (over > 0) {
          const toX = cxW - hx;
          const toY = cyW - hy;
          const d = Math.hypot(toX, toY) || 1;
          dx += (toX / d) * w * 0.55;
          dy += (toY / d) * w * 0.55;
        }
      }

      const desired = Math.atan2(dy, dx);
      // Turning circle grows with speed — no pivot-in-place (ref agility 0.8 cruise)
      const agility = Math.min(0.8, sh.speed / (L * 0.22));
      const maxTurn = agility * dt;
      const turned = clamp(angleDiff(sh.heading, desired), -maxTurn, maxTurn);
      sh.heading += turned;
      sh.turn += (turned / dt - sh.turn) * Math.min(1, dt * 3);

      // Pace aligned with ref: gentle filter-feeders / sunfish cruise slower.
      const gentle =
        sh.kind === 'manta' || sh.kind === 'whaleshark' || sh.kind === 'sunfish';
      const pace = sh.kind === 'sunfish' ? 0.63 : gentle ? 0.8 : 1;
      // After ripple sprint: target follows decaying boost (capped); soft pull = long decelerate.
      const baseCruiseStep = (30 + L * 0.04) * pace;
      const cruise = Math.min(
        baseCruiseStep * RIPPLE_SPEED_CAP,
        baseCruiseStep * (1 + RIPPLE_BOOST_PEAK * sh.rippleBoost),
      );
      const settle = sh.rippleBoost > 0.02 ? 0.55 : 1.1; // slower ease while coasting down
      sh.speed += (cruise - sh.speed) * Math.min(1, dt * settle);
      // Hard ceiling so repeated clicks cannot stack past ~4× cruise.
      if (sh.speed > baseCruiseStep * RIPPLE_SPEED_CAP) {
        sh.speed = baseCruiseStep * RIPPLE_SPEED_CAP;
      }
      sh.phase += dt * (2 + sh.speed / 24);

      nodes[0] = hx + Math.cos(sh.heading) * sh.speed * dt;
      nodes[1] = hy + Math.sin(sh.heading) * sh.speed * dt;

      // Follow-the-leader spine with limited joint bend
      const seg = L / (SHARK_NODES - 1);
      const maxBend = 0.16;
      let prevAngle = sh.heading + Math.PI;
      for (let k = 1; k < SHARK_NODES; k++) {
        const px = nodes[(k - 1) * 2]!;
        const py = nodes[(k - 1) * 2 + 1]!;
        let angle = Math.atan2(nodes[k * 2 + 1]! - py, nodes[k * 2]! - px);
        angle = prevAngle + clamp(angleDiff(prevAngle, angle), -maxBend, maxBend);
        nodes[k * 2] = px + Math.cos(angle) * seg;
        nodes[k * 2 + 1] = py + Math.sin(angle) * seg;
        prevAngle = angle;
      }

      // Wait until the snout is ~a body-length off-screen (silhouette already edge-faded)
      // before species-cycling — avoids a sudden pop/vanish at the lip.
      const exitPad = Math.max(L * 0.95, Math.min(W, H) * 0.14);
      if (hx < -exitPad || hx > W + exitPad || hy < -exitPad || hy > H + exitPad) {
        this.reenterShark(sh);
      }
    }
  }

  /** Place shark just off a random edge, facing inward, with a new kind. */
  private reenterShark(sh: Shark) {
    const { width: W, height: H } = this;
    const minSide = Math.min(W, H);
    const cast = this.allowedKinds.length ? this.allowedKinds : ALL_SHARK_KINDS;
    const used = new Set(this.sharks.filter((s) => s !== sh).map((s) => s.kind));
    const unused = cast.filter((k) => k !== sh.kind && !used.has(k));
    const other = cast.filter((k) => k !== sh.kind);
    const pool = unused.length ? unused : other.length ? other : cast;
    const kind = pool[randInt(0, pool.length - 1)]!;
    const size = KIND_SIZE[kind] ?? 1;
    const baseLength = this.mobile
      ? clamp(minSide * 0.24, 70, 132)
      : clamp(minSide * 0.40, 160, 340);
    const length = baseLength * size;

    const side = randInt(0, 3);
    const along = rand(0.18, 0.82);
    const margin = length * 0.85;
    let x: number;
    let y: number;
    if (side === 0) {
      x = -margin;
      y = along * H;
    } else if (side === 1) {
      x = W + margin;
      y = along * H;
    } else if (side === 2) {
      x = along * W;
      y = -margin;
    } else {
      x = along * W;
      y = H + margin;
    }
    // Enter along the margin corridor (tangential), with a mild bias toward the ring.
    let heading: number;
    if (side === 0) heading = Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) + rand(-0.25, 0.25);
    else if (side === 1) heading = Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) + rand(-0.25, 0.25);
    else if (side === 2) heading = (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.25, 0.25);
    else heading = (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.25, 0.25);
    // Nudge slightly inward so they clear the lip into the periphery band.
    const inward = Math.atan2(H / 2 - y, W / 2 - x);
    heading = Math.atan2(
      Math.sin(heading) * 0.75 + Math.sin(inward) * 0.25,
      Math.cos(heading) * 0.75 + Math.cos(inward) * 0.25,
    );

    sh.kind = kind;
    sh.length = length;
    sh.heading = heading;
    sh.speed = 30 + length * 0.04;
    sh.phase = rand(0, TAU);
    sh.turn = 0;
    sh.wander = 0;
    sh.orbitDir = Math.random() < 0.5 ? 1 : -1;
    sh.orbitRadius = minSide * rand(0.42, 0.58);
    sh.depth = size;
    sh.rippleBoost = 0;
    sh.rippleHitStamp = 0;

    const nodes = sh.nodes;
    const seg = length / (SHARK_NODES - 1);
    for (let n = 0; n < SHARK_NODES; n++) {
      nodes[n * 2] = x - Math.cos(heading) * seg * n;
      nodes[n * 2 + 1] = y - Math.sin(heading) * seg * n;
    }
  }

  private respawn() {
    const { time, width: W, height: H } = this;
    const due: Fish[] = [];
    for (const f of this.fish) if (!f.alive && f.respawnAt <= time) due.push(f);
    if (due.length === 0) return;
    if (due.length < 6 && time - this.lastSpawn < 9) return;
    this.lastSpawn = time;

    const side = randInt(0, 3);
    const along = rand(0.15, 0.85);
    const x = side === 0 ? -20 : side === 1 ? W + 20 : along * W;
    const y = side === 2 ? -20 : side === 3 ? H + 20 : along * H;
    const inward = Math.atan2(H / 2 - y, W / 2 - x) + rand(-0.5, 0.5);
    const species = pickSpecies();
    const sp = SPECIES[species]!;
    const millDir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    for (const f of due.slice(0, sp.schoolSize[1])) {
      f.alive = true;
      f.species = species;
      f.alarm = 0;
      f.turn = 0;
      f.millDir = millDir;
      f.x = x + rand(-1, 1) * this.perception * 0.55;
      f.y = y + rand(-1, 1) * this.perception * 0.42;
      f.vx = Math.cos(inward) * sp.cruise * 1.4;
      f.vy = Math.sin(inward) * sp.cruise * 1.4;
    }
  }
}
