/**
 * Character-ocean engine facade for XinbaoWiki.
 *
 * Clean-room recreation of the jiezi1234/character-ocean *look*: multi-node
 * spine sharks with body-wave undulation, dense Couzin-zone schools, soft
 * currents, and cell-raster glyph silhouettes. Does not vendor unlicensed
 * ascii-sharks engine|world|renderer sources.
 */

import {
  EDGE_HEAVY,
  EDGE_LIGHT,
  FIN_GLYPHS,
  MARK_GLYPHS,
  RIDGE_GLYPHS,
  enStreamGlyph,
  fontFamilyFor,
  glyphRampFor,
  pickGlyph,
  schoolFishParts,
  schoolFishSilhouette,
  type ActiveOceanStyle,
  zhStreamGlyph,
} from '@/lib/character-ocean/alphabets';
import { clamp, hash3 } from '@/lib/character-ocean/math';
import {
  FLAG_BODY,
  FLAG_EDGE,
  FLAG_EYE,
  FLAG_FIN,
  FLAG_MARK,
  FLAG_RIDGE,
  FLAG_TAIL,
  SharkSampler,
  tintFor,
  type Hit,
} from '@/lib/character-ocean/silhouette';
import {
  CHARACTER_OCEAN_MOBILE_MAX_WIDTH,
  type CharacterOceanLanguage,
} from '@/lib/site-character-ocean';
import {
  World,
  RIPPLE_DURATION_MS,
  RIPPLE_WAVE_SPEED,
  type SharkKind,
} from '@/lib/character-ocean/world';

export type OceanEngineOptions = {
  style: ActiveOceanStyle;
  language: CharacterOceanLanguage;
  reducedMotion: boolean;
  /** Soft translucent field over site wallpaper (default true). */
  wash?: boolean;
  /** Field richness: school/shark count + glyph pitch (0.35–2). */
  density?: number;
  /** Canvas field opacity (0.2–1); also mirrored via CSS var. */
  opacity?: number;
  /** Allowed silhouette species. */
  kinds?: SharkKind[];
};

const STEP = 1 / 60;
const MAX_STEPS = 4;
const SUBSAMPLES = [0.25, 0.3, 0.75, 0.3, 0.25, 0.72, 0.75, 0.72];


const KIND_INDEX: Record<string, number> = {
  classic: 0, hammerhead: 1, tiger: 2, zebra: 3, greathammer: 4,
  mako: 5, thresher: 6, nurse: 7, manta: 8, whaleshark: 9, sunfish: 10,
};
const KIND_BY_INDEX: SharkKind[] = [
  'classic', 'hammerhead', 'tiger', 'zebra', 'greathammer',
  'mako', 'thresher', 'nurse', 'manta', 'whaleshark', 'sunfish',
];

export class CharacterOceanEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: OceanEngineOptions;
  private world = new World();
  private sampler = new SharkSampler();
  private hit: Hit = { inside: false, flag: 0, shade: 0, s: 0, dist: 0, angle: 0 };
  private cw = 10;
  private ch = 14;
  private cols = 0;
  private rows = 0;
  private dpr = 1;
  private viewW = 1;
  private viewH = 1;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;
  private visible = true;
  private mobile = false;
  private speed = 0.65;
  private themeObserver: MutationObserver | null = null;
  private io: IntersectionObserver | null = null;
  private ro: ResizeObserver | null = null;
  private onVis: (() => void) | null = null;
  private onPointerMove: ((e: PointerEvent) => void) | null = null;
  private onPointerDown: ((e: PointerEvent) => void) | null = null;
  private onPointerLeave: (() => void) | null = null;
  private motionMq: MediaQueryList | null = null;
  private onMotionChange: (() => void) | null = null;

  private sharkFlag = new Uint8Array(0);
  private sharkShade = new Float32Array(0);
  private sharkKey = new Uint32Array(0);
  private sharkKindId = new Uint8Array(0);
  private sharkS = new Float32Array(0);
  private fishStamp = new Uint32Array(0);
  private frameId = 1;
  private splashLife: { x: number; y: number; born: number }[] = [];
  /** Soft fade under portal / article text so glyphs don't fight readability. */
  private contentRects: { l: number; t: number; r: number; b: number }[] = [];
  private contentRectsAt = 0;

  constructor(canvas: HTMLCanvasElement, opts: OceanEngineOptions) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('2d context unavailable');
    this.canvas = canvas;
    this.ctx = ctx;
    this.opts = { wash: true, ...opts };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.applyFieldOpacity();
    this.world.setAllowedKinds(this.opts.kinds ?? []);
    this.world.setDensity(this.opts.density ?? 1);
    this.detectMobile();
    this.resize();
    this.bind();
    this.applyThemeFilter();
    // Settle schools briefly so first paint is not empty/jerky
    for (let i = 0; i < 48; i++) this.world.step(STEP);
    this.last = performance.now();
    if (this.opts.reducedMotion) {
      this.drawStill();
      return;
    }
    this.loop(this.last);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.unbind();
  }

  setOptions(partial: Partial<OceanEngineOptions>) {
    const prevMotion = this.opts.reducedMotion;
    const prevDens = this.opts.density ?? 1;
    this.opts = { ...this.opts, ...partial };
    this.applyThemeFilter();
    this.applyFieldOpacity();
    this.world.setAllowedKinds(this.opts.kinds ?? []);
    this.world.setDensity(this.opts.density ?? 1);
    const prevMobile = this.mobile;
    this.detectMobile();
    const densChanged = Math.abs((this.opts.density ?? 1) - prevDens) >= 0.001;
    // Skip canvas buffer rebuild when only style/opacity/language/kinds cosmetics changed.
    if (densChanged || prevMobile !== this.mobile) {
      this.resize();
    }
    if (this.opts.reducedMotion) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.drawStill();
    } else if (prevMotion && this.running) {
      this.last = performance.now();
      this.loop(this.last);
    }
  }

  private applyFieldOpacity() {
    if (this.opts.wash === false) {
      this.canvas.style.opacity = '1';
      return;
    }
    const op = clamp(this.opts.opacity ?? 0.92, 0.2, 1);
    this.canvas.style.opacity = String(op);
  }

  private detectMobile() {
    const w = window.innerWidth;
    // Viewport band matches site gate; coarse pointer alone must not force
    // mobile sizing on a large tablet/desktop touchscreen.
    this.mobile = w <= CHARACTER_OCEAN_MOBILE_MAX_WIDTH;
    this.world.setMobile(this.mobile);
    this.speed = this.opts.reducedMotion ? 0 : this.mobile ? 0.55 : 0.65;
  }

  private bind() {
    this.ro = new ResizeObserver(() => {
      this.detectMobile();
      this.resize();
    });
    this.ro.observe(this.canvas.parentElement || this.canvas);

    this.io = new IntersectionObserver(
      (entries) => {
        this.visible = entries.some((e) => e.isIntersecting);
      },
      { threshold: 0.01 },
    );
    this.io.observe(this.canvas);

    this.onVis = () => {
      if (document.hidden) return;
      this.last = performance.now();
    };
    document.addEventListener('visibilitychange', this.onVis);

    this.themeObserver = new MutationObserver(() => this.applyThemeFilter());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    });

    this.motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionChange = () => {
      this.setOptions({ reducedMotion: !!this.motionMq?.matches });
    };
    this.motionMq.addEventListener('change', this.onMotionChange);

    this.onPointerMove = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      this.world.pointer.x = x;
      this.world.pointer.y = y;
      this.world.pointer.active = inside && e.pointerType !== 'touch';
    };
    this.onPointerDown = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      if (this.opts.reducedMotion) return;
      this.world.splash(x, y);
      this.splashLife.push({ x, y, born: performance.now() });
      if (this.splashLife.length > 4) this.splashLife.shift();
    };
    this.onPointerLeave = () => {
      this.world.pointer.active = false;
    };
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    window.addEventListener('pointerup', this.onPointerLeave, { passive: true });
    window.addEventListener('pointercancel', this.onPointerLeave, { passive: true });
  }

  private unbind() {
    this.ro?.disconnect();
    this.io?.disconnect();
    this.themeObserver?.disconnect();
    if (this.motionMq && this.onMotionChange) {
      this.motionMq.removeEventListener('change', this.onMotionChange);
    }
    this.motionMq = null;
    this.onMotionChange = null;
    if (this.onVis) document.removeEventListener('visibilitychange', this.onVis);
    if (this.onPointerMove) window.removeEventListener('pointermove', this.onPointerMove);
    if (this.onPointerDown) window.removeEventListener('pointerdown', this.onPointerDown);
    if (this.onPointerLeave) {
      window.removeEventListener('pointerup', this.onPointerLeave);
      window.removeEventListener('pointercancel', this.onPointerLeave);
    }
    this.splashLife.length = 0;
  }

  private isLightTheme(): boolean {
    const root = document.documentElement;
    const theme = root.getAttribute('data-theme') || '';
    if (theme === 'light') return true;
    if (theme === 'dark') return false;
    if (root.classList.contains('dark')) return false;
    return matchMedia('(prefers-color-scheme: light)').matches;
  }

  private applyThemeFilter() {
    const wash = this.opts.wash !== false;
    if (!wash && this.isLightTheme()) {
      this.canvas.style.filter = 'invert(1) hue-rotate(180deg) saturate(0.55)';
    } else {
      this.canvas.style.filter = 'none';
    }
    // Opacity is owned by applyFieldOpacity / the settings slider — do not
    // overwrite it here (theme observer used to clobber the user value).
    this.applyFieldOpacity();
  }

  private resize() {
    this.contentRectsAt = 0;
    const parent = this.canvas.parentElement || this.canvas;
    const w = Math.max(1, parent.clientWidth || window.innerWidth);
    const h = Math.max(1, parent.clientHeight || window.innerHeight);
    this.viewW = w;
    this.viewH = h;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    // Density pulls cell pitch: higher = finer grid (busier field), lower = chunkier glyphs.
    const dens = clamp(this.opts.density ?? 1, 0.35, 2);
    if (this.mobile) {
      const targetCols = clamp(Math.round((w / 10) * (0.75 + dens * 0.45)), 36, 90);
      this.cw = clamp(w / targetCols, 5.5, 13);
    } else {
      const baseCols = 148 * (0.7 + dens * 0.55);
      this.cw = clamp(Math.round(w / baseCols), 5.5, 13);
    }
    this.ch = Math.max(9, Math.round(this.cw * 1.4));
    this.cols = Math.max(8, Math.ceil(w / this.cw));
    this.rows = Math.max(8, Math.ceil(h / this.ch));

    const n = this.cols * this.rows;
    if (this.sharkFlag.length !== n) {
      this.sharkFlag = new Uint8Array(n);
      this.sharkShade = new Float32Array(n);
      this.sharkKey = new Uint32Array(n);
      this.sharkKindId = new Uint8Array(n);
      this.sharkS = new Float32Array(n);
      this.fishStamp = new Uint32Array(n);
    }

    const bw = Math.floor(w * this.dpr);
    const bh = Math.floor(h * this.dpr);
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const had = this.world.width > 0;
    this.world.resize(w, h, this.cw, this.ch);
    if (!had) {
      for (let i = 0; i < 60; i++) this.world.step(STEP);
    }
  }

  private loop = (now: number) => {
    if (!this.running || this.opts.reducedMotion) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible || document.hidden) {
      this.last = now;
      return;
    }
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt * this.speed;
    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.world.step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;
    this.draw(now);
  };

  private drawStill() {
    if (this.world.time < 4) {
      for (let i = 0; i < 180; i++) this.world.step(STEP);
    }
    this.draw(performance.now());
  }

  private cellIndex(x: number, y: number) {
    const c = Math.floor(x / this.cw);
    const r = Math.floor(y / this.ch);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
    return r * this.cols + c;
  }

  private rasterizeSharks() {
    const { sharkFlag, sharkShade, sharkKey, sharkKindId, sharkS, cw, ch, cols, rows } = this;
    sharkFlag.fill(0);
    sharkShade.fill(0);
    sharkKey.fill(0);
    sharkKindId.fill(0);
    sharkS.fill(0);
    const hit = this.hit;

    for (const sh of this.world.sharks) {
      const L = sh.length;
      this.sampler.prepare(sh, cw);
      const reach = L * 0.36;
      const b = this.sampler.bounds(reach);
      const c0 = Math.max(0, Math.floor(b.minX / cw));
      const c1 = Math.min(cols - 1, Math.floor(b.maxX / cw));
      const r0 = Math.max(0, Math.floor(b.minY / ch));
      const r1 = Math.min(rows - 1, Math.floor(b.maxY / ch));
      if (c0 > c1 || r0 > r1) continue;
      const skipBeyond = reach + Math.hypot(cw, ch);

      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const x = c * cw;
          const y = r * ch;
          const centerHit = (() => {
            this.sampler.sample(x + cw * 0.5, y + ch * 0.5, L, hit);
            return hit.inside;
          })();
          if (!centerHit && hit.dist > skipBeyond) continue;
          const flag = hit.flag;
          const shade = hit.shade;
          const sAlong = hit.s;
          const vAcross = hit.dist;
          let hits = centerHit ? 1 : 0;
          for (let k = 0; k < SUBSAMPLES.length; k += 2) {
            this.sampler.sample(x + SUBSAMPLES[k]! * cw, y + SUBSAMPLES[k + 1]! * ch, L, hit);
            if (hit.inside) hits++;
          }
          if (hits === 0) continue;
          const coverage = hits / 5;
          const i = r * cols + c;
          // Body-anchored key so glyphs ride with the skin (ref).
          const key = (hash3(Math.round(sAlong * 52), Math.round(vAcross / (cw * 0.9)), sh.id) * 4294967295) >>> 0;
          sharkKey[i] = key;
          sharkKindId[i] = KIND_INDEX[sh.kind] ?? 0;
          sharkS[i] = sAlong;
          if (centerHit && coverage >= 0.5) {
            sharkFlag[i] = flag || FLAG_BODY;
            const flicker = (hash3(c, r, Math.floor(performance.now() / 160)) - 0.5) * 0.06;
            sharkShade[i] = clamp(shade + flicker, 0, 1);
          } else {
            sharkFlag[i] = FLAG_EDGE;
            sharkShade[i] = coverage;
          }
        }
      }
    }
  }

  private draw(now: number) {
    const ctx = this.ctx;
    const w = this.viewW;
    const h = this.viewH;
    const { cw, ch, cols, rows } = this;
    this.refreshContentRects();
    ctx.clearRect(0, 0, w, h);

    const wash = this.opts.wash !== false;
    const darkDemo = !wash;
    if (darkDemo) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, w, h);
      // Subtle cell plate like the demo grid
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillRect(c * cw + 1, r * ch + 1, cw - 1, ch - 1);
        }
      }
    }

    this.rasterizeSharks();
    this.frameId = (this.frameId + 1) >>> 0;

    const style = this.opts.style;
    const ramp = glyphRampFor(style, this.opts.language);
    const family = fontFamilyFor(style, this.opts.language);
    const fontSize = Math.max(9, Math.round(ch * (style === 'hanzi' ? 0.92 : style === 'ascii' || style === 'type' ? 0.88 : 0.84)));
    ctx.font = `${style === 'hanzi' ? 500 : 600} ${fontSize}px ${family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sharks
    for (let i = 0; i < this.sharkFlag.length; i++) {
      const flag = this.sharkFlag[i]!;
      if (!flag) continue;
      const col = i % cols;
      const row = (i / cols) | 0;
      const x = col * cw + cw * 0.5;
      const y = row * ch + ch * 0.5;
      const shade = this.sharkShade[i]!;
      const key = this.sharkKey[i]!;
      const edge = flag === FLAG_EDGE;

      let density = 0.35 + shade * 0.55;
      let glyph: string;
      const sAlong = this.sharkS[i] ?? 0;
      const enMeaningful = this.opts.language === 'en' && (style === 'ascii' || style === 'type');
      if (flag === FLAG_RIDGE) {
        density = 0.95;
        glyph = RIDGE_GLYPHS[(key >>> 8) % RIDGE_GLYPHS.length]!;
      } else if (flag === FLAG_EYE) {
        density = 0.15;
        glyph = style === 'ascii' || style === 'type' ? 'o' : pickGlyph(ramp, 0.2, key);
      } else if (flag === FLAG_MARK) {
        density = 0.85;
        glyph = enMeaningful
          ? enStreamGlyph(sAlong, key, 0.9)
          : MARK_GLYPHS[(key >>> 8) % MARK_GLYPHS.length]!;
      } else if (flag === FLAG_TAIL) {
        density = 0.55 + shade * 0.3;
        glyph = enMeaningful
          ? enStreamGlyph(sAlong, key, density)
          : style === 'ascii'
            ? FIN_GLYPHS[(key >>> 8) % FIN_GLYPHS.length]!
            : pickGlyph(ramp, density, key);
      } else if (flag === FLAG_FIN) {
        density = 0.4 + shade * 0.5;
        glyph =
          style === 'ascii' || style === 'type'
            ? FIN_GLYPHS[(key >>> 8) % FIN_GLYPHS.length]!
            : pickGlyph(ramp, density, key);
      } else if (edge) {
        density = 0.22 + shade * 0.35;
        // Prefer heavy rim marks so head/body/tail outline stays readable.
        const set = shade >= 0.28 ? EDGE_HEAVY : EDGE_LIGHT;
        glyph =
          style === 'ascii' || style === 'type'
            ? set[(key >>> 8) % set.length]!
            : pickGlyph(ramp, density, key);
      } else if (style === 'ascii' || style === 'type') {
        density = 0.45 + shade * 0.55;
        if (this.opts.language === 'zh') {
          // ZH: coherent theme Hanzi streams along the spine (mirror EN)
          glyph = zhStreamGlyph(sAlong, key, density);
        } else {
          // EN: coherent theme letter-streams along the spine
          glyph = enStreamGlyph(sAlong, key, density);
        }
      } else {
        glyph = pickGlyph(ramp, density, key);
      }

      const punch = this.mobile ? 1.18 : 1.12;
      const isFinLike = flag === FLAG_FIN || flag === FLAG_TAIL || flag === FLAG_RIDGE || flag === FLAG_MARK;
      if (darkDemo && !edge && flag !== FLAG_EYE) {
        const level = 46 + shade * 160;
        const kind: SharkKind = KIND_BY_INDEX[this.sharkKindId[i]!] ?? 'classic';
        const [tr, tg, tb] = tintFor(kind);
        ctx.globalAlpha = 0.7 * this.edgeFade(x, y);
        ctx.fillStyle = `rgb(${Math.round(level * tr)},${Math.round(level * tg)},${Math.min(255, Math.round(level * tb))})`;
        if (ctx.globalAlpha > 0.02) ctx.fillRect(col * cw + 1, row * ch + 1, cw - 1, ch - 1);
      } else if (wash && !edge && flag !== FLAG_EYE && (density > 0.28 || isFinLike)) {
        // Dense skin plate under body + fins so the silhouette holds at mid size.
        const plateFade = this.fadeAt(x, y) * this.edgeFade(x, y);
        const plateA = Math.min(0.82, (0.38 + density * 0.55) * (this.mobile ? 1.05 : 1.0)) * plateFade;
        ctx.globalAlpha = plateA;
        ctx.fillStyle = this.mobile ? 'rgba(4, 8, 16, 0.7)' : 'rgba(6, 10, 18, 0.72)';
        if (plateFade > 0.02) ctx.fillRect(col * cw + 0.35, row * ch + 0.35, cw - 0.7, ch - 0.7);
      } else if (wash && edge) {
        // Soft outline plate so head/body/tail rim stays visible.
        const plateFade = this.fadeAt(x, y) * this.edgeFade(x, y);
        ctx.globalAlpha = (0.22 + shade * 0.35) * plateFade;
        ctx.fillStyle = 'rgba(8, 12, 20, 0.55)';
        if (plateFade > 0.02) ctx.fillRect(col * cw + 0.5, row * ch + 0.5, cw - 1, ch - 1);
      }

      const rimFade = this.edgeFade(x, y);
      ctx.globalAlpha = (wash
        ? edge
          ? (0.55 + shade * 0.4) * punch
          : Math.min(1, (0.9 + density * 0.18) * punch)
        : edge
          ? 0.45 + shade * 0.4
          : 0.9) * rimFade;
      ctx.fillStyle = wash
        ? this.mobile
          ? 'rgba(2, 6, 12, 1)'
          : 'rgba(3, 6, 12, 1)'
        : flag === FLAG_EYE
          ? '#9aa0ad'
          : shade > 0.55
            ? '#0e0f13'
            : '#1b1d24';
      if (!wash && hash3(key, Math.floor(now / 400), 7) < 0.08) {
        ctx.fillStyle = ['#e0892c', '#33c8cc', '#3150e8', '#d9c14a'][key % 4]!;
      }
      const textFade = this.fadeAt(x, y);
      ctx.globalAlpha *= textFade;
      if (textFade * rimFade > 0.02) ctx.fillText(glyph, x, y + 1);
    }

    // Mid school fish -- head+body+tail with a glance-readable body glyph.
    // Prior failure modes: 3-5px ink (illegible), wash dark-plate+dark-ink (no contrast),
    // and content fadeAt 0.18 wiping mid-page schools. Keep mid-sardine, not whales.
    this.fishStamp.fill(0);
    for (const f of this.world.fish) {
      if (!f.alive) continue;
      const i = this.cellIndex(f.x, f.y);
      if (i < 0) continue;
      if (this.sharkFlag[i]) continue;
      if (this.fishStamp[i] === this.frameId) continue;
      this.fishStamp[i] = this.frameId;
      const col = i % cols;
      const row = (i / cols) | 0;
      const glint = clamp(Math.abs(f.turn) / 6 + f.alarm * 0.35, 0, 1);
      const washBoost = wash ? (this.mobile ? 1.35 : 1.7) : 1;
      const alpha = Math.min(1, (0.78 + f.depth * 0.35 + glint * 0.3) * washBoost);
      const parts = schoolFishParts(style, this.opts.language, f.vx, f.species * 131 + Math.floor(f.phase * 64));
      const fx = col * cw + cw * 0.5;
      const fy = row * ch + ch * 0.5 + 1;
      // School fish stay quieter under copy, but never vanish -- body letters must read.
      const textFade = Math.max(this.fadeAt(fx, fy), 0.52);
      const rimFade = Math.max(this.edgeFade(fx, fy), 0.4);
      const vis = Math.min(1, alpha * textFade * rimFade);
      const prevFont = ctx.font;
      const prevBaseline: CanvasTextBaseline = ctx.textBaseline;
      const family = fontFamilyFor(style, this.opts.language);
      // Mid sardine: tips ~5-6px, body ~7-9px (readable letter/Hanzi; not the old 9-12 whale).
      const tipPx = Math.max(5, Math.min(6, Math.round(Math.min(ch * 0.48, cw * 0.58, 6))));
      const bodyIsCjk = /[\u4e00-\u9fff]/.test(parts.body);
      const bodyPx = Math.max(7, Math.min(9, tipPx + 2));
      // YaHei/PingFang first -- Noto Sans SC is not loaded as a webfont on this site.
      const bodyFamily = bodyIsCjk
        ? '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Segoe UI", sans-serif'
        : family;
      try {
        (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '-0.15px';
      } catch {
        /* older engines ignore */
      }
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${tipPx}px ${family}`;
      const headW = Math.max(parts.head ? ctx.measureText(parts.head).width : 0, parts.head ? tipPx * 0.45 : 0);
      const tailW = Math.max(parts.tail ? ctx.measureText(parts.tail).width : 0, parts.tail ? tipPx * 0.45 : 0);
      ctx.font = `700 ${bodyPx}px ${bodyFamily}`;
      const bodyW = Math.max(parts.body ? ctx.measureText(parts.body).width : 0, bodyPx * (bodyIsCjk ? 0.9 : 0.55));
      const gap = 0.4;
      const totalW = headW + gap + bodyW + gap + tailW;
      const left = fx - totalW * 0.5;
      if (vis > 0.03) {
        // Soft opposite-tone halo so ink/light glyphs keep internal contrast (no dark-on-dark plate).
        const ph = Math.max(bodyPx + 2, tipPx + 2, 8);
        ctx.globalAlpha = Math.min(0.4, vis * 0.42);
        ctx.fillStyle = wash ? 'rgba(255, 255, 255, 0.62)' : 'rgba(4, 8, 16, 0.55)';
        ctx.fillRect(left - 1, fy - ph * 0.55, totalW + 2, ph);
      }
      ctx.globalAlpha = vis;
      const ink = wash
        ? 'rgba(8, 14, 28, 0.96)'
        : `rgba(236, 242, 255, ${0.82 + glint * 0.18})`;
      const halo = wash ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.45)';
      if (vis > 0.02) {
        let x = left;
        const drawPart = (glyph: string, px: number, fontFamily: string, w: number, emphasize: boolean) => {
          if (!glyph) return;
          ctx.font = `700 ${px}px ${fontFamily}`;
          if (emphasize) {
            ctx.lineJoin = 'round';
            ctx.lineWidth = Math.max(1, px * 0.14);
            ctx.strokeStyle = halo;
            ctx.strokeText(glyph, x, fy);
          }
          ctx.fillStyle = ink;
          ctx.fillText(glyph, x, fy);
          x += w + gap;
        };
        drawPart(parts.head, tipPx, family, headW, false);
        drawPart(parts.body, bodyPx, bodyFamily, bodyW, true);
        drawPart(parts.tail, tipPx, family, tailW, false);
      }
      try {
        (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0px';
      } catch {
        /* ignore */
      }
      ctx.textBaseline = prevBaseline;
      ctx.font = prevFont;
    }

    // Splash ripples -- pixelated wave train (chunky concentric rings).
    // Same pond-physics envelope as before (expanding front, multi-crest damp),
    // but drawn as stepped pixel tiles instead of smooth Material radial gradients.
    const splashDuration = RIPPLE_DURATION_MS;
    const cutoff = now - splashDuration;
    this.splashLife = this.splashLife.filter((s) => s.born > cutoff);
    while (this.splashLife.length > 4) this.splashLife.shift();
    const WAVE_SPEED = RIPPLE_WAVE_SPEED; // px/s leading front
    const WAVELENGTH = 28; // crest-to-crest (snaps onto PIXEL grid below)
    const DAMP_TIME = 0.95;
    const DAMP_DIST = 0.0095;
    const PIXEL = 4; // chunk size; rings expand in PIXEL steps
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    for (const s of this.splashLife) {
      const ageMs = now - s.born;
      const age = ageMs / 1000;
      const lifeT = ageMs / splashDuration;
      if (lifeT >= 1) continue;
      const base = wash ? 0.62 : 0.88;
      const ink = wash ? '24,42,68' : '190,220,250';
      const trough = wash ? '10,16,28' : '100,140,180';
      // Quantize origin so tiles lock to a stable grid across frames.
      const ox = Math.round(s.x / PIXEL) * PIXEL;
      const oy = Math.round(s.y / PIXEL) * PIXEL;
      const frontRaw = WAVE_SPEED * age;
      const front = Math.max(PIXEL, Math.round(frontRaw / PIXEL) * PIXEL);

      const paintPixelDisk = (
        radius: number,
        rgb: string,
        alpha: number,
        hollowInner = 0,
      ) => {
        if (alpha < 0.02 || radius < PIXEL * 0.5) return;
        const rMax = Math.ceil(radius / PIXEL) * PIXEL;
        const rInner = Math.max(0, hollowInner);
        const gap = Math.max(1, PIXEL - 1); // 1px gutter keeps the chunky look
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

      // Center impact blot -- brief chunky dimple that blooms into the first crest.
      if (age < 0.3) {
        const bt = age / 0.3;
        const ease = 1 - Math.pow(1 - bt, 2.2);
        const blotR = PIXEL * (1 + Math.round(ease * 4));
        paintPixelDisk(blotR, trough, 0.55 * (1 - bt) * base);
        paintPixelDisk(blotR + PIXEL, ink, 0.28 * (1 - bt) * base, blotR * 0.35);
      }

      // Soft energy disc under the train (pixel wash, flat alpha).
      if (front > PIXEL * 2 && lifeT < 0.85) {
        const washR = Math.min(front * 0.9, 160);
        const energy = Math.exp(-DAMP_TIME * age) * (1 - lifeT * 0.55);
        paintPixelDisk(washR, ink, 0.05 * energy * base, washR * 0.35);
      }

      // Multi-crest / trough pixel rings behind the leading front.
      const maxCrests = 6;
      for (let n = 0; n < maxCrests; n++) {
        const rRaw = frontRaw - n * WAVELENGTH;
        const r = Math.round(rRaw / PIXEL) * PIXEL;
        if (r < PIXEL * 2 || r > front + PIXEL) continue;
        const amp =
          Math.exp(-DAMP_TIME * age) *
          Math.exp(-DAMP_DIST * r) *
          (1 / Math.sqrt(1 + r * 0.018)) *
          (1 - lifeT * 0.35);
        if (amp < 0.02) continue;
        const isCrest = n % 2 === 0;
        // Band thickness in whole pixels -- thicker near impact, thinner outward.
        const bandPx = Math.max(PIXEL, (isCrest ? 2 : 1) * PIXEL - (n > 2 ? PIXEL : 0));
        const peak = Math.min(1, amp * (isCrest ? 1.2 : 0.75)) * base * (1 - n * 0.06);
        if (peak < 0.02) continue;
        const color = isCrest ? ink : trough;
        const inner = Math.max(0, r - bandPx * 0.55);
        const outer = r + bandPx * 0.55;
        paintPixelDisk(outer, color, peak * (isCrest ? 0.95 : 0.7), inner);
        // Leading-edge glint as a 1-pixel ring (still chunky).
        if (isCrest && n < 3 && peak > 0.1) {
          const glintR = r + PIXEL;
          paintPixelDisk(glintR + PIXEL * 0.15, ink, peak * 0.55, glintR - PIXEL * 0.35);
        }
      }
    }
    ctx.imageSmoothingEnabled = prevSmooth;

    ctx.globalAlpha = 1;
  }

  private refreshContentRects() {
    if (typeof document === 'undefined') return;
    const now = performance.now();
    if (now - this.contentRectsAt < 120) return;
    this.contentRectsAt = now;
    // Real homepage / article text chrome — keep vicinity quiet.
    const sels = [
      '.wiki-portal',
      '.wiki-portal-hero',
      '.wiki-portal-masthead',
      '.wiki-portal-brand',
      '.wiki-portal-name',
      '.wiki-portal-name-text',
      '.wiki-portal-search',
      '.wiki-search-portal',
      '.wiki-portal-editions',
      '.wiki-portal-edition',
      '.wiki-portal-disclosures',
      '.wiki-portal-news',
      '.wiki-portal-timeline',
      '.wiki-portal-updates-window',
      '.wiki-portal-directory',
      '.wiki-portal-cube-stage',
      '.wiki-portal-block',
      '.wiki-portal-group',
      '.wiki-portal-group-label',
      '.wiki-home-scroll-intro',
      '.wiki-home-scroll-intro-link',
      '.wiki-topbar',
      '.wiki-footer',
      '.wiki-article-layout-text',
      '.wiki-article-contents',
      '.wiki-article-facts',
      '.wiki-body',
      '.wiki-body h1',
      '.wiki-body h2',
      '.wiki-body h3',
      '.wiki-body p',
      '.wiki-body li',
      // Do not include bare `main` — on the homepage it wraps the full portal
      // and would ghost the entire school to ~18% alpha.
      '[data-ocean-fade]',
    ];
    const out: { l: number; t: number; r: number; b: number }[] = [];
    const seen = new Set<string>();
    for (const sel of sels) {
      const nodes = document.querySelectorAll(sel);
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i] as HTMLElement;
        if (!el) continue;
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) < 0.05) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 6 || r.height < 6) continue;
        // Skip fully off-screen
        if (r.bottom < -40 || r.top > window.innerHeight + 40) continue;
        if (r.right < -40 || r.left > window.innerWidth + 40) continue;
        const key = `${r.left | 0},${r.top | 0},${r.right | 0},${r.bottom | 0}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ l: r.left, t: r.top, r: r.right, b: r.bottom });
      }
    }
    this.contentRects = out;
  }

  /**
   * 1 = full ink. Under/near text → near-zero so homepage copy stays readable.
   * x/y are canvas CSS pixels; map through canvas viewport rect.
   */
  /** Soft alpha falloff near / past the viewport rim so exits don't pop. */
  private edgeFade(x: number, y: number): number {
    const w = this.viewW;
    const h = this.viewH;
    if (w <= 0 || h <= 0) return 1;
    const band = Math.min(110, Math.min(w, h) * 0.12);
    const dx = Math.min(x, w - x);
    const dy = Math.min(y, h - y);
    const d = Math.min(dx, dy);
    if (d >= band) return 1;
    return clamp(d / band, 0, 1);
  }

  private fadeAt(x: number, y: number): number {
    const rects = this.contentRects;
    if (!rects.length) return 1;
    const cr = this.canvas.getBoundingClientRect();
    const px = x + cr.left;
    const py = y + cr.top;
    let fade = 1;
    // Soft quiet halo around text/UI — a touch quieter, still faintly visible.
    const pad = 110;
    const insideAlpha = 0.18;
    const rimAlpha = 0.32;
    for (let i = 0; i < rects.length; i++) {
      const box = rects[i]!;
      const l = box.l - pad;
      const t = box.t - pad;
      const r = box.r + pad;
      const b = box.b + pad;
      if (px < l || px > r || py < t || py > b) continue;
      const inside = px >= box.l && px <= box.r && py >= box.t && py <= box.b;
      if (inside) {
        fade = Math.min(fade, insideAlpha);
        continue;
      }
      // Distance into the pad ring (0 at outer edge, 1 at box edge).
      const dx = Math.min(px - l, r - px);
      const dy = Math.min(py - t, b - py);
      const edge = Math.min(dx, dy) / pad;
      // Smoothstep so vicinity goes quiet before touching glyphs.
      const tEdge = edge * edge * (3 - 2 * edge);
      fade = Math.min(fade, 1 - (1 - rimAlpha) * tEdge);
    }
    return fade;
  }

}

export function createCharacterOceanEngine(canvas: HTMLCanvasElement, opts: OceanEngineOptions) {
  const engine = new CharacterOceanEngine(canvas, opts);
  engine.start();
  return engine;
}
