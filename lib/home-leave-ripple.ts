/**
 * Homepage leave ripple — same chunky pixel circular rings as ocean click
 * splash ripples (PIXEL=4 disks), scaled larger for the nav-wait beat.
 */

export const HOME_LEAVE_RIPPLE_MS = 2850;

const PIXEL = 4;
/** Compact snappy bloom: 158/2.85s; wash ~0.42 viewport; 5 crests; nav decoupled. */
const WAVE_SPEED = 158;
const WAVELENGTH = 40;
const DAMP_TIME = 0.44;
const DAMP_DIST = 0.0035;

function parseCssRgb(raw: string, fallback: string): string {
  const v = raw.trim();
  if (!v) return fallback;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = Number.parseInt(h, 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }
  const m = /^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(v)
    || /^rgba?\((\d+)\s+(\d+)\s+(\d+)/i.exec(v);
  if (m) return `${m[1]},${m[2]},${m[3]}`;
  return fallback;
}

function themeInkPair(): { ink: string; trough: string; base: number } {
  const style = getComputedStyle(document.documentElement);
  const accent = parseCssRgb(style.getPropertyValue("--site-theme-accent"), "158,176,200");
  const action = parseCssRgb(style.getPropertyValue("--site-theme-action-ink"), "29,36,48");
  return { ink: accent, trough: action, base: 0.92 };
}

/**
 * Paint one leave splash onto `canvas` for `HOME_LEAVE_RIPPLE_MS`.
 * Returns a disposer that cancels the rAF loop.
 */
export function startHomeLeaveRipple(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => undefined;

  const born = performance.now();
  const { ink, trough, base } = themeInkPair();
  let raf = 0;
  let stopped = false;

  const resize = () => {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const paintPixelDisk = (
    ox: number,
    oy: number,
    radius: number,
    rgb: string,
    alpha: number,
    hollowInner = 0,
  ) => {
    if (alpha < 0.02 || radius < PIXEL * 0.5) return;
    const rMax = Math.ceil(radius / PIXEL) * PIXEL;
    const rInner = Math.max(0, hollowInner);
    const gap = Math.max(1, PIXEL - 1);
    ctx.fillStyle = `rgba(${rgb},${Math.min(1, alpha)})`;
    for (let py = -rMax; py <= rMax; py += PIXEL) {
      for (let px = -rMax; px <= rMax; px += PIXEL) {
        const cx = px + PIXEL * 0.5;
        const cy = py + PIXEL * 0.5;
        const d = Math.hypot(cx, cy);
        if (d > radius + PIXEL * 0.35) continue;
        if (d < rInner - PIXEL * 0.15) continue;
        ctx.fillRect(ox + px, oy + py, gap, gap);
      }
    }
  };

  const frame = (now: number) => {
    if (stopped) return;
    const ageMs = now - born;
    const lifeT = ageMs / HOME_LEAVE_RIPPLE_MS;
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    if (lifeT >= 1) {
      stopped = true;
      return;
    }

    ctx.imageSmoothingEnabled = false;
    const ox = Math.round(w * 0.5 / PIXEL) * PIXEL;
    const oy = Math.round(h * 0.5 / PIXEL) * PIXEL;
    const age = ageMs / 1000;
    const frontRaw = WAVE_SPEED * age;
    const front = Math.max(PIXEL, Math.round(frontRaw / PIXEL) * PIXEL);

    // Center impact blot
    if (age < 0.45) {
      const bt = age / 0.45;
      const ease = 1 - Math.pow(1 - bt, 2.2);
      const blotR = PIXEL * (2 + Math.round(ease * 7));
      paintPixelDisk(ox, oy, blotR, trough, 0.62 * (1 - bt) * base);
      paintPixelDisk(ox, oy, blotR + PIXEL * 2, ink, 0.34 * (1 - bt) * base, blotR * 0.35);
    }

    // Soft energy disc (larger than click wash)
    if (front > PIXEL * 2 && lifeT < 0.9) {
      const washR = Math.min(front * 0.92, Math.min(w, h) * 0.42);
      const energy = Math.exp(-DAMP_TIME * age) * (1 - lifeT * 0.5);
      paintPixelDisk(ox, oy, washR, ink, 0.07 * energy * base, washR * 0.4);
    }

    // Multi-crest circular pixel rings — same language as ocean click splash
    const maxCrests = 5;
    for (let n = 0; n < maxCrests; n++) {
      const rRaw = frontRaw - n * WAVELENGTH;
      const r = Math.round(rRaw / PIXEL) * PIXEL;
      if (r < PIXEL * 2 || r > front + PIXEL) continue;
      const amp =
        Math.exp(-DAMP_TIME * age) *
        Math.exp(-DAMP_DIST * r) *
        (1 / Math.sqrt(1 + r * 0.012)) *
        (1 - lifeT * 0.28);
      if (amp < 0.02) continue;
      const isCrest = n % 2 === 0;
      const bandPx = Math.max(PIXEL, (isCrest ? 3 : 2) * PIXEL - (n > 2 ? PIXEL : 0));
      const peak = Math.min(1, amp * (isCrest ? 1.35 : 0.8)) * base * (1 - n * 0.05);
      if (peak < 0.02) continue;
      const color = isCrest ? ink : trough;
      const inner = Math.max(0, r - bandPx * 0.55);
      const outer = r + bandPx * 0.55;
      paintPixelDisk(ox, oy, outer, color, peak * (isCrest ? 0.98 : 0.72), inner);
      if (isCrest && n < 4 && peak > 0.1) {
        const glintR = r + PIXEL;
        paintPixelDisk(ox, oy, glintR + PIXEL * 0.15, ink, peak * 0.6, glintR - PIXEL * 0.35);
      }
    }

    raf = window.requestAnimationFrame(frame);
  };

  const onResize = () => {
    if (stopped) return;
    resize();
  };
  window.addEventListener("resize", onResize, { passive: true });
  raf = window.requestAnimationFrame(frame);

  return () => {
    stopped = true;
    window.cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } catch {
      /* ignore */
    }
  };
}
let activeSession: { dispose: () => void } | null = null;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Mount a leave-ripple canvas on document.body and run until HOME_LEAVE_RIPPLE_MS.
 * Survives homepage / HomeScrollIntro unmount so the bloom can finish over the next page.
 * No-ops if one is already playing or reduced-motion is on.
 */
export function playHomeLeaveRipple(): void {
  if (typeof document === "undefined") return;
  if (prefersReducedMotion()) return;
  if (activeSession) return;

  const canvas = document.createElement("canvas");
  canvas.className = "wiki-home-leave-ripple";
  canvas.setAttribute("data-home-leave-ripple", "");
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const stopPaint = startHomeLeaveRipple(canvas);
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(timer);
    stopPaint();
    try {
      canvas.remove();
    } catch {
      /* ignore */
    }
    if (activeSession?.dispose === dispose) activeSession = null;
  };
  const dispose = () => finish();
  const timer = window.setTimeout(finish, HOME_LEAVE_RIPPLE_MS + 32);
  activeSession = { dispose };
}

/** Hard-stop (pagehide / bfcache). Route changes should NOT call this. */
export function abortHomeLeaveRipple(): void {
  activeSession?.dispose();
  activeSession = null;
}
