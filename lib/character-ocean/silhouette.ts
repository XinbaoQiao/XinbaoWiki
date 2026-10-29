/**
 * Clean-room shark silhouette sampling along a follow-the-leader spine.
 * Full species set (classic / hammerheads / tiger / zebra / mako / thresher /
 * nurse / manta / whale shark / sunfish) with markings + manta disc sampling.
 * Proportions observed from the public demo look; reimplemented independently.
 */

import { clamp, hash3, smoothstep } from '@/lib/character-ocean/math';
import { SHARK_NODES, type Shark, type SharkKind } from '@/lib/character-ocean/world';

export const FLAG_NONE = 0;
export const FLAG_BODY = 1;
export const FLAG_EDGE = 2;
export const FLAG_FIN = 3;
export const FLAG_RIDGE = 4;
export const FLAG_EYE = 5;
export const FLAG_MARK = 6;
export const FLAG_TAIL = 7;

export type Hit = {
  inside: boolean;
  flag: number;
  shade: number;
  s: number;
  dist: number;
  angle: number;
};

function classicHalfWidth(s: number) {
  if (s < 0.13) return 0.09 * Math.pow(Math.sin(((s / 0.13) * Math.PI) / 2), 0.95);
  if (s < 0.3) return 0.09 + 0.016 * smoothstep(0.13, 0.3, s);
  if (s < 0.84) return 0.019 + 0.087 * Math.pow(1 - (s - 0.3) / 0.54, 1.25);
  const k = (s - 0.84) / 0.16;
  return 0.019 * (1 - k) + 0.012 * Math.sin(k * Math.PI);
}

type Shape = {
  halfWidth: (s: number) => number;
  pectoral: [number, number, number, number];
  falcate: boolean;
  pelvic: [number, number, number, number];
  caudal: number;
  dorsal: [number, number];
  secondDorsal: [number, number];
  eye: [number, number] | null;
  gills: [number, number];
  head?: { span: number; sweep: number; depth: number; notch: number };
  /** Per-species cool/warm RGB multipliers (aligned with ref silhouette tints). */
  tint: [number, number, number];
};

const SHAPES: Record<SharkKind, Shape> = {
  classic: {
    halfWidth: classicHalfWidth,
    pectoral: [0.15, 0.43, 0.55, 0.26],
    falcate: true,
    pelvic: [0.57, 0.65, 0.69, 0.085],
    caudal: 0.085,
    dorsal: [0.33, 0.47],
    secondDorsal: [0.71, 0.76],
    eye: [0.1, 0.14],
    gills: [0.19, 0.29],
    tint: [0.92, 0.97, 1.05],
  },
  hammerhead: {
    halfWidth: (s) => {
      if (s < 0.06) return 0.045;
      if (s < 0.3) return 0.045 + 0.061 * smoothstep(0.06, 0.3, s);
      return classicHalfWidth(s) * 0.92;
    },
    head: { span: 0.17, sweep: 0.035, depth: 0.09, notch: 0 },
    pectoral: [0.17, 0.4, 0.5, 0.22],
    falcate: true,
    pelvic: [0.56, 0.63, 0.67, 0.075],
    caudal: 0.11,
    dorsal: [0.28, 0.44],
    secondDorsal: [0.7, 0.74],
    eye: null,
    gills: [0.16, 0.26],
    tint: [0.96, 0.98, 0.9],
  },
  tiger: {
    halfWidth: (s) => {
      if (s < 0.13) return 0.1 * Math.pow(Math.sin(((s / 0.13) * Math.PI) / 2), 0.45);
      if (s < 0.3) return 0.1 + 0.014 * smoothstep(0.13, 0.3, s);
      if (s < 0.84) return 0.019 + 0.095 * Math.pow(1 - (s - 0.3) / 0.54, 1.2);
      const k = (s - 0.84) / 0.16;
      return 0.019 * (1 - k) + 0.012 * Math.sin(k * Math.PI);
    },
    pectoral: [0.15, 0.42, 0.53, 0.25],
    falcate: true,
    pelvic: [0.57, 0.65, 0.69, 0.085],
    caudal: 0.095,
    dorsal: [0.33, 0.46],
    secondDorsal: [0.71, 0.75],
    eye: [0.08, 0.12],
    gills: [0.19, 0.28],
    tint: [1.02, 0.95, 0.84],
  },
  zebra: {
    halfWidth: (s) => {
      if (s < 0.1) return 0.075 * Math.pow(Math.sin(((s / 0.1) * Math.PI) / 2), 0.7);
      if (s < 0.28) return 0.075 + 0.025 * smoothstep(0.1, 0.28, s);
      if (s < 0.55) return 0.022 + 0.078 * Math.pow(1 - (s - 0.28) / 0.27, 1.1);
      const k = (s - 0.55) / 0.45;
      return 0.022 * (1 - k * k) + 0.012 * Math.sin(k * Math.PI);
    },
    pectoral: [0.12, 0.3, 0.36, 0.19],
    falcate: false,
    pelvic: [0.42, 0.48, 0.51, 0.065],
    caudal: 0,
    dorsal: [0.36, 0.44],
    secondDorsal: [0.49, 0.53],
    eye: [0.06, 0.09],
    gills: [0.13, 0.2],
    tint: [1.08, 0.97, 0.74],
  },
  greathammer: {
    halfWidth: (s) => {
      if (s < 0.05) return 0.04;
      if (s < 0.3) return 0.04 + 0.07 * smoothstep(0.05, 0.3, s);
      return classicHalfWidth(s) * 0.95;
    },
    head: { span: 0.21, sweep: 0.006, depth: 0.085, notch: 0.014 },
    pectoral: [0.16, 0.38, 0.49, 0.24],
    falcate: true,
    pelvic: [0.55, 0.62, 0.67, 0.085],
    caudal: 0.13,
    dorsal: [0.24, 0.45],
    secondDorsal: [0.68, 0.74],
    eye: null,
    gills: [0.15, 0.25],
    tint: [0.86, 0.93, 1.02],
  },
  mako: {
    halfWidth: (s) => {
      if (s < 0.17) return 0.088 * Math.pow(Math.sin(((s / 0.17) * Math.PI) / 2), 1.5);
      if (s < 0.32) return 0.088 + 0.012 * smoothstep(0.17, 0.32, s);
      if (s < 0.86) return 0.014 + 0.086 * Math.pow(1 - (s - 0.32) / 0.54, 1.45);
      const k = (s - 0.86) / 0.14;
      return 0.014 * (1 - k) + 0.01 * Math.sin(k * Math.PI);
    },
    pectoral: [0.18, 0.4, 0.5, 0.21],
    falcate: true,
    pelvic: [0.58, 0.64, 0.68, 0.06],
    caudal: 0.13,
    dorsal: [0.34, 0.45],
    secondDorsal: [0.76, 0.79],
    eye: [0.11, 0.15],
    gills: [0.2, 0.3],
    tint: [0.78, 0.9, 1.2],
  },
  thresher: {
    halfWidth: (s) => {
      if (s < 0.08) return 0.07 * Math.pow(Math.sin(((s / 0.08) * Math.PI) / 2), 0.75);
      if (s < 0.2) return 0.07 + 0.02 * smoothstep(0.08, 0.2, s);
      if (s < 0.48) return 0.012 + 0.078 * Math.pow(1 - (s - 0.2) / 0.28, 1.3);
      const k = (s - 0.48) / 0.52;
      return 0.012 * (1 - k) + 0.006 * Math.sin(k * Math.PI * 0.9) + 0.002;
    },
    pectoral: [0.12, 0.27, 0.36, 0.2],
    falcate: true,
    pelvic: [0.37, 0.41, 0.44, 0.045],
    caudal: 0,
    dorsal: [0.24, 0.32],
    secondDorsal: [0.45, 0.47],
    eye: [0.05, 0.1],
    gills: [0.11, 0.18],
    tint: [1.0, 0.9, 1.08],
  },
  nurse: {
    halfWidth: (s) => {
      if (s < 0.08) return 0.085 * Math.pow(Math.sin(((s / 0.08) * Math.PI) / 2), 0.4);
      if (s < 0.3) return 0.085 + 0.02 * smoothstep(0.08, 0.3, s);
      if (s < 0.72) return 0.022 + 0.083 * Math.pow(1 - (s - 0.3) / 0.42, 1.1);
      const k = (s - 0.72) / 0.28;
      return 0.022 * (1 - k * k) + 0.014 * Math.sin(k * Math.PI);
    },
    pectoral: [0.16, 0.34, 0.4, 0.17],
    falcate: false,
    pelvic: [0.45, 0.52, 0.55, 0.075],
    caudal: 0,
    dorsal: [0.5, 0.58],
    secondDorsal: [0.63, 0.69],
    eye: [0.05, 0.075],
    gills: [0.14, 0.22],
    tint: [1.1, 0.96, 0.76],
  },
  manta: {
    halfWidth: (s) => {
      if (s < 0.08) return 0.06 + 0.025 * smoothstep(0, 0.08, s);
      if (s < 0.48) return 0.018 + 0.075 * Math.sin(((s - 0.08) / 0.4) * Math.PI);
      return 0.008 * (1 - (s - 0.48) / 0.52) + 0.002;
    },
    pectoral: [0.045, 0.56, 0.3, 0.6],
    falcate: false,
    pelvic: [0.4, 0.5, 0.52, 0.055],
    caudal: 0,
    dorsal: [2, 2],
    secondDorsal: [2, 2],
    eye: [0.065, 0.14],
    gills: [2, 2],
    tint: [0.85, 0.96, 1.04],
  },
  whaleshark: {
    halfWidth: (s) => {
      if (s < 0.08) return 0.105 + 0.027 * smoothstep(0, 0.08, s);
      if (s < 0.32) return 0.132;
      if (s < 0.86) return 0.018 + 0.114 * Math.pow(1 - (s - 0.32) / 0.54, 1.1);
      return 0.018 * (1 - (s - 0.86) / 0.14) + 0.003;
    },
    pectoral: [0.18, 0.45, 0.56, 0.24],
    falcate: false,
    pelvic: [0.61, 0.7, 0.75, 0.09],
    caudal: 0.12,
    dorsal: [0.39, 0.48],
    secondDorsal: [0.73, 0.77],
    eye: [0.025, 0.09],
    gills: [0.16, 0.29],
    tint: [0.72, 0.94, 1.16],
  },
  sunfish: {
    halfWidth: (s) => {
      if (s < 0.12) return 0.06 + 0.095 * smoothstep(0, 0.12, s);
      if (s < 0.76) return 0.075 + 0.14 * Math.pow(Math.sin(((s - 0.12) / 0.64) * Math.PI), 0.8);
      return 0.065 * (1 - (s - 0.76) / 0.24) + 0.018;
    },
    pectoral: [0.15, 0.28, 0.33, 0.18],
    falcate: false,
    pelvic: [0.4, 0.78, 0.66, 0.34],
    caudal: 0.045,
    dorsal: [0.42, 0.7],
    secondDorsal: [2, 2],
    eye: [0.055, 0.14],
    gills: [0.16, 0.21],
    tint: [0.99, 1.02, 0.88],
  },
};

/** Species RGB multipliers for cell fill (ref silhouette tint). */
export function tintFor(kind: SharkKind): [number, number, number] {
  return SHAPES[kind].tint;
}


function inTriangle(
  u: number,
  v: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
) {
  const d1 = (u - bx) * (ay - by) - (ax - bx) * (v - by);
  const d2 = (u - cx) * (by - cy) - (bx - cx) * (v - cy);
  const d3 = (u - ax) * (cy - ay) - (cx - ax) * (v - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

export class SharkSampler {
  spine = new Float32Array(SHARK_NODES * 2);
  arc = new Float32Array(SHARK_NODES);
  arcTotal = 1;
  finTipRight = 0;
  finTipLeft = 0;
  private shape: Shape = SHAPES.classic;
  private kind: SharkKind = 'classic';
  private sharkId = 1;
  private cellW = 10;

  prepare(sh: Shark, cellW = 10) {
    this.shape = SHAPES[sh.kind];
    this.kind = sh.kind;
    this.sharkId = sh.id;
    this.cellW = cellW;
    const L = sh.length;
    const N = SHARK_NODES;
    const n = sh.nodes;
    const swim = clamp(sh.speed / 60, 0.4, 1.4);

    for (let k = 0; k < N; k++) {
      const s = k / (N - 1);
      const a = Math.max(0, k - 1);
      const b = Math.min(N - 1, k + 1);
      let tx = n[a * 2]! - n[b * 2]!;
      let ty = n[a * 2 + 1]! - n[b * 2 + 1]!;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const amp = L * 0.05 * (0.1 + 0.9 * Math.pow(s, 1.8)) * swim;
      const off = amp * Math.sin(sh.phase - s * 5.2);
      this.spine[k * 2] = n[k * 2]! - ty * off;
      this.spine[k * 2 + 1] = n[k * 2 + 1]! + tx * off;
    }
    this.arc[0] = 0;
    for (let k = 1; k < N; k++) {
      this.arc[k] =
        this.arc[k - 1]! +
        Math.hypot(
          this.spine[k * 2]! - this.spine[(k - 1) * 2]!,
          this.spine[k * 2 + 1]! - this.spine[(k - 1) * 2 + 1]!,
        );
    }
    this.arcTotal = this.arc[N - 1]! || 1;

    const bank = clamp(sh.turn * 0.45, -0.35, 0.35);
    const flex = 1 + 0.06 * Math.sin(sh.phase * 0.5);
    const reachFin = this.shape.pectoral[3];
    this.finTipRight = L * reachFin * flex * (1 - bank);
    this.finTipLeft = L * reachFin * flex * (1 + bank);
  }

  bounds(pad: number) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let k = 0; k < SHARK_NODES; k++) {
      minX = Math.min(minX, this.spine[k * 2]!);
      maxX = Math.max(maxX, this.spine[k * 2]!);
      minY = Math.min(minY, this.spine[k * 2 + 1]!);
      maxY = Math.max(maxY, this.spine[k * 2 + 1]!);
    }
    // Manta wings extend far across the spine axis
    if (this.kind === 'manta') {
      const tip = Math.max(this.finTipLeft, this.finTipRight);
      minX -= tip;
      maxX += tip;
      minY -= tip;
      maxY += tip;
    }
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
    };
  }

  /** Skin markings: whale spots, tiger bars, zebra leopard spots. */
  private marked(s: number, v: number, L: number, across: number): boolean {
    if (this.kind === 'whaleshark') {
      if (s < 0.1 || s > 0.81) return false;
      const u = s / 0.052;
      const w = v / (L * 0.043);
      const x = u - Math.floor(u) - 0.5;
      const y = w - Math.floor(w) - 0.5;
      return x * x + y * y < 0.075;
    }
    if (this.kind === 'tiger') {
      if (s < 0.2 || s > 0.9 || across > 0.85) return false;
      const wobble = 0.35 * Math.sin((v / L) * 25 + s * 5);
      const bar = Math.sin(s * Math.PI * 2 * 9 + wobble);
      return bar > 0.65 - 0.5 * smoothstep(0.2, 0.42, s) + 0.4 * smoothstep(0.8, 0.9, s);
    }
    if (this.kind === 'zebra') {
      if (s < 0.07) return false;
      const gu = (s * L) / (L * 0.06);
      const gv = v / (L * 0.045);
      const cu = Math.floor(gu);
      const cv = Math.floor(gv);
      const jx = hash3(cu, cv, this.sharkId) * 0.5 + 0.25;
      const jy = hash3(cu, cv, this.sharkId + 11) * 0.5 + 0.25;
      return (gu - cu - jx) ** 2 + (gv - cv - jy) ** 2 < 0.08;
    }
    return false;
  }

  private sampleManta(px: number, py: number, L: number, out: Hit): Hit {
    const { spine } = this;
    const dx = spine[20]! - spine[0]!;
    const dy = spine[21]! - spine[1]!;
    const axisLength = Math.hypot(dx, dy) || 1;
    const tx = dx / axisLength;
    const ty = dy / axisLength;
    const localLength = (axisLength * (SHARK_NODES - 1)) / 10;
    const x = px - spine[0]!;
    const y = py - spine[1]!;
    const s = (x * tx + y * ty) / localLength;
    const v = -x * ty + y * tx;
    const a = Math.abs(v) / localLength;
    const reach = (v > 0 ? this.finTipRight : this.finTipLeft) / L;
    const q = a / (reach || 1e-3);
    out.s = s;
    out.dist = Math.abs(v);
    out.angle = Math.atan2(ty, tx);
    out.flag = FLAG_BODY;
    out.shade = 0.2;
    out.inside = false;

    const lobeCentre = 0.075 + 0.12 * Math.max(0, s);
    if (s >= -0.045 && s <= 0.065) {
      const lobeWidth = 0.009 + 0.009 * smoothstep(-0.045, 0.05, s);
      if (Math.abs(a - lobeCentre) < lobeWidth * Math.sqrt(Math.max(0, 1 - ((s - 0.01) / 0.055) ** 2))) {
        out.inside = true;
        out.flag = s < 0 ? FLAG_RIDGE : FLAG_BODY;
        out.shade = s < 0 ? 0.95 : 0.36;
        return out;
      }
    }

    const front = 0.022 + 0.278 * Math.pow(q, 1.45) + 0.016 * Math.exp((-q * q) / 0.012);
    const back = 0.56 - 0.25 * Math.pow(q, 0.7);
    if (q <= 1 && s >= front && s <= back) {
      const shoulder = ((a - 0.112) / 0.05) ** 2 + ((s - 0.092 - (a - 0.112) * 0.7) / 0.025) ** 2;
      const wingBand = front + 0.025 + 0.025 * Math.sin(q * Math.PI);
      const paleWing = q > 0.42 && Math.abs(s - wingBand) < 0.009 + 0.013 * smoothstep(0.65, 1, q);
      const rearRidge = Math.abs(a - (0.56 - s) * 0.25) < 0.008 && s > 0.29;
      const mouthRim = a < 0.08 && s - front < 0.008;
      out.inside = true;
      out.shade = 0.16 + 0.15 * (1 - q) + 0.08 * Math.sin(((s - front) / (back - front)) * Math.PI);
      if (shoulder < 1 || paleWing || rearRidge || mouthRim) {
        out.flag = FLAG_RIDGE;
        out.shade = 0.9 + 0.1 * (1 - Math.min(1, shoulder));
      } else if (s > 0.05 && s < 0.09 && a > 0.09 && a < 0.115) {
        out.flag = FLAG_EYE;
        out.shade = 0;
      }
      return out;
    }

    if (s > 0.48) {
      for (let k = 10; k < SHARK_NODES - 1; k++) {
        const ax = spine[k * 2]!;
        const ay = spine[k * 2 + 1]!;
        const sx = spine[k * 2 + 2]! - ax;
        const sy = spine[k * 2 + 3]! - ay;
        const len2 = sx * sx + sy * sy || 1;
        const along = ((px - ax) * sx + (py - ay) * sy) / len2;
        if (along < 0 || along > 1) continue;
        const distance = Math.hypot(px - ax - sx * along, py - ay - sy * along);
        const tailS = (k + along) / (SHARK_NODES - 1);
        const width = Math.max(this.cellW * 0.22, L * (0.0045 - tailS * 0.0025));
        if (distance <= width) {
          out.inside = true;
          out.s = tailS;
          out.dist = distance;
          out.flag = FLAG_TAIL;
          out.shade = 0.76;
          out.angle = Math.atan2(sy, sx);
          return out;
        }
      }
    }
    return out;
  }

  sample(px: number, py: number, L: number, out: Hit): Hit {
    if (this.kind === 'manta') return this.sampleManta(px, py, L, out);

    const { spine, arc } = this;
    const N = SHARK_NODES;
    let best = Infinity;
    let bestS = 0;
    let bestSign = 1;
    let bestNx = 0;
    let bestNy = 0;
    let hitAngle = 0;

    for (let k = 0; k < N - 1; k++) {
      const ax = spine[k * 2]!;
      const ay = spine[k * 2 + 1]!;
      const sx = spine[(k + 1) * 2]! - ax;
      const sy = spine[(k + 1) * 2 + 1]! - ay;
      const len2 = sx * sx + sy * sy || 1;
      const u = clamp(((px - ax) * sx + (py - ay) * sy) / len2, 0, 1);
      const qx = ax + sx * u;
      const qy = ay + sy * u;
      const d2 = (px - qx) ** 2 + (py - qy) ** 2;
      if (d2 < best) {
        best = d2;
        const len = Math.sqrt(len2);
        bestS = (arc[k]! + u * len) / this.arcTotal;
        bestSign = sx * (py - ay) - sy * (px - ax) >= 0 ? 1 : -1;
        bestNx = (-sy / len) * bestSign;
        bestNy = (sx / len) * bestSign;
        hitAngle = Math.atan2(sy, sx);
      }
    }

    const a = Math.sqrt(best);
    const s = bestS;
    const u = s * L;
    const shape = this.shape;
    const w = shape.halfWidth(s) * L;
    out.dist = a;
    out.s = s;
    out.angle = hitAngle;
    out.inside = false;
    out.flag = FLAG_NONE;
    out.shade = 0;

    const head = shape.head;
    if (head && u < L * (head.sweep + head.depth + head.notch)) {
      const span = L * head.span;
      const r = a / span;
      const front = L * head.sweep * r * r + L * head.notch * Math.max(0, 1 - r / 0.14);
      const depth = L * head.depth * (1 - 0.2 * r * r * r * r);
      if (r <= 1 && u >= front && u <= front + depth) {
        out.inside = true;
        out.flag = r > 0.84 ? FLAG_EYE : FLAG_BODY;
        out.shade = r > 0.84 ? 0 : 0.62 - 0.2 * r;
        return out;
      }
    }

    if (a <= w) {
      const across = a / (w || 1);
      const facing = (bestNx * -0.6 + bestNy * -0.8) * across;
      let shade = 0.58 - across * across * 0.42 + facing * 0.26;
      let flag = FLAG_BODY;
      if (this.marked(s, a * bestSign, L, across)) {
        flag = FLAG_MARK;
        shade = Math.min(1, shade + 0.35);
      } else if (s > shape.dorsal[0] && s < shape.dorsal[1] && across < 0.3) {
        flag = FLAG_RIDGE;
        shade = 1;
      } else if (s > shape.secondDorsal[0] && s < shape.secondDorsal[1] && across < 0.4) {
        shade = Math.max(shade, 0.82);
      } else if (shape.eye && s > shape.eye[0] && s < shape.eye[1] && across > 0.6) {
        flag = FLAG_EYE;
        shade = 0;
      } else if (s > shape.gills[0] && s < shape.gills[1] && across > 0.58) {
        if (Math.floor(((s - shape.gills[0]) / (shape.gills[1] - shape.gills[0])) * 5) % 2 === 0) shade *= 0.45;
      } else if (s < 0.05) {
        shade = Math.max(shade, 0.7);
      }
      out.inside = true;
      out.flag = flag;
      out.shade = shade;
      return out;
    }

    const tip = bestSign > 0 ? this.finTipRight : this.finTipLeft;
    const [p0, p1, p2] = shape.pectoral;
    if (
      inTriangle(u, a, L * p0, 0, L * p1, 0, L * p2, tip) &&
      !(shape.falcate && inTriangle(u, a, L * p1, 0, L * (p1 + (p2 - p1) * 0.33), tip * 0.55, L * p2, tip))
    ) {
      out.inside = true;
      out.flag = FLAG_FIN;
      out.shade = 0.38 + 0.22 * (1 - clamp(a / tip, 0, 1));
      return out;
    }
    const [v0, v1, v2, vr] = shape.pelvic;
    if (
      inTriangle(u, a, L * v0, 0, L * v1, 0, L * v2, L * vr) ||
      (shape.caudal > 0 && inTriangle(u, a, L * 0.86, 0, L * 0.95, 0, L, L * shape.caudal))
    ) {
      out.inside = true;
      out.flag = FLAG_FIN;
      out.shade = 0.36;
      return out;
    }
    // Thresher / zebra / nurse long upper-lobe ribbon when caudal is 0
    if (shape.caudal === 0 && s > 0.48 && a < L * 0.028 * (0.35 + (s - 0.48))) {
      out.inside = true;
      out.flag = FLAG_TAIL;
      out.shade = 0.7;
      return out;
    }
    return out;
  }
}
