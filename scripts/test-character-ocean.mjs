import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// Execute the actual TypeScript modules, including their alias imports.
const modules = new Map();
function loadTypeScript(relativePath) {
  const filename = path.resolve(relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  });
  new Function('require', 'module', 'exports', outputText)(
    name => loadTypeScript(`${name.replace('@/', '')}.ts`), module, module.exports
  );
  return module.exports;
}

const { SharkSampler } = loadTypeScript('lib/character-ocean/silhouette.ts');
const fixtures = JSON.parse(fs.readFileSync('tests/fixtures/character-ocean-silhouettes.json', 'utf8'));
for (const expected of fixtures) {
  const nodes = new Float32Array(40);
  for (let k = 0; k < 20; k++) {
    nodes[k * 2] = 440 - k * 13;
    nodes[k * 2 + 1] = 300 + Math.sin(k * 0.3 + expected.pose) * 22;
  }
  const sampler = new SharkSampler();
  sampler.prepare({ nodes, kind: expected.kind, id: 7, length: 300, phase: expected.pose, speed: 48, turn: Math.sin(expected.pose) * 0.8 }, 9);
  const counts = Array(8).fill(0);
  let shade = 0;
  let distance = 0;
  let along = 0;
  for (let y = 170; y <= 430; y += 13) for (let x = 120; x <= 510; x += 13) {
    const hit = sampler.sample(x, y, 300, {});
    if (hit.inside) { counts[hit.flag]++; shade += hit.shade; distance += hit.dist; along += hit.s; }
  }
  const label = `${expected.kind}/${expected.pose}`;
  assert.deepEqual(counts, expected.counts, `${label}: preserve silhouette coverage and markings`);
  for (const [key, value] of Object.entries({ shade, distance, along })) {
    assert.ok(Math.abs(value - expected[key]) < 1e-8, `${label}: preserve ${key}`);
  }
}

function eventSource() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    emit(type, event) { for (const fn of listeners.get(type) || []) fn(event); }
  };
}

const savedGlobals = new Map(['window', 'document', 'performance', 'ResizeObserver', 'IntersectionObserver', 'MutationObserver', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
try {
  let now = 1000;
  let nextFrameId = 1;
  let rectReads = 0;
  let measurements = 0;
  let paints = 0;
  let fontReads = 0;
  let currentFont = '10px sans-serif';
  const frames = new Map();
  const resizeObservers = [];
  const intersectionObservers = [];
  const documentEvents = eventSource();
  const fonts = eventSource();
  const windowEvents = eventSource();
  const motion = { ...eventSource(), matches: false };
  const root = { classList: { contains: () => false }, getAttribute: () => 'light' };
  const parent = { clientWidth: 1440, clientHeight: 1000 };
  const ctx = {
    textBaseline: 'middle', globalAlpha: 1,
    clearRect() { paints++; },
    measureText(text) { measurements++; return { width: text.length * Number(currentFont.match(/(\d+)px/)?.[1] || 10) }; },
    fillRect() {}, fillText() {}, strokeText() {}, setTransform() {}
  };
  Object.defineProperty(ctx, 'font', {
    get() { fontReads++; return currentFont; },
    set(value) { currentFont = value; }
  });
  const canvas = {
    parentElement: parent, style: {}, width: 0, height: 0,
    getContext: () => ctx,
    getBoundingClientRect() { rectReads++; return { left: 30, top: 40, width: parent.clientWidth, height: parent.clientHeight }; }
  };
  const text = { getBoundingClientRect: () => ({ left: 200, top: 200, right: 600, bottom: 400, width: 400, height: 200 }) };
  Object.assign(globalThis, {
    window: { ...windowEvents, innerWidth: 1440, innerHeight: 1000, devicePixelRatio: 1, matchMedia: () => motion },
    document: { ...documentEvents, documentElement: root, fonts, hidden: false, querySelectorAll: () => [text] },
    performance: { now: () => now },
    getComputedStyle: () => ({ visibility: 'visible', display: 'block', opacity: '1', contentVisibility: 'visible' }),
    requestAnimationFrame: fn => { const id = nextFrameId++; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { constructor(fn) { this.fn = fn; resizeObservers.push(this); } observe() {} disconnect() { this.disconnected = true; } },
    IntersectionObserver: class { constructor(fn) { this.fn = fn; intersectionObservers.push(this); } observe() {} disconnect() { this.disconnected = true; } },
    MutationObserver: class { observe() {} disconnect() {} }
  });
  const advance = delta => {
    now += delta;
    const callbacks = [...frames.values()];
    frames.clear();
    for (const fn of callbacks) fn(now);
  };
  const { createCharacterOceanEngine } = loadTypeScript('lib/character-ocean/engine.ts');
  const engine = createCharacterOceanEngine(canvas, { style: 'ascii', language: 'en', reducedMotion: false });
  let rasters = 0;
  const rasterize = engine.rasterizeSharks.bind(engine);
  engine.rasterizeSharks = time => { rasters++; rasterize(time); };
  const rasterSnapshot = () => ['sharkFlag', 'sharkShade', 'sharkKey', 'sharkKindId', 'sharkS'].map(key => [...engine[key]]);
  assert.equal(frames.size, 1, 'one animation owner after start');
  advance(16);
  assert.equal(rectReads, 1, 'one canvas layout read for the entire rendered frame');
  assert.equal(rasters, 1, 'the first frame samples the shark geometry');
  assert.ok(measurements > 0, 'school glyphs are rendered and measured');
  const initialMeasurements = measurements;
  advance(1); // Same simulation pose: all glyph widths must come from the cache.
  assert.equal(measurements, initialMeasurements, 'identical glyphs reuse font measurements');
  assert.equal(rectReads, 2, 'canvas origin is refreshed once per frame');
  assert.equal(rasters, 1, 'a frame with no simulation or flicker change reuses the raster');
  assert.equal(paints, 2, 'raster reuse preserves the display-frame cadence');
  assert.equal(fontReads, 0, 'drawing does not repeatedly read native font state');
  assert.equal(engine.fadeAt(200, 200), 0.16, 'cached canvas origin preserves text fading');
  fonts.emit('loadingdone');
  advance(1);
  assert.ok(measurements > initialMeasurements, 'loaded fonts invalidate cached widths');
  assert.notEqual(engine.measureText('x', '700 7px serif'), engine.measureText('x', '700 9px serif'), 'width caches remain separate for each font');
  advance(20);
  assert.equal(rasters, 2, 'a simulation step invalidates the raster');
  let snapshot = rasterSnapshot();
  rasterize(now);
  assert.deepEqual(rasterSnapshot(), snapshot, 'a reused raster matches a full fresh computation');
  const speed = engine.speed;
  engine.speed = 0;
  advance(160);
  assert.equal(rasters, 3, 'flicker still updates when geometry has not moved');
  snapshot = rasterSnapshot();
  rasterize(now);
  assert.deepEqual(rasterSnapshot(), snapshot, 'clock-based shading remains equal to a fresh raster');
  engine.speed = speed;
  engine.setOptions({ kinds: ['manta'] });
  advance(1);
  assert.equal(rasters, 4, 'changing species invalidates the previous geometry');
  assert.ok(engine.world.sharks.every(shark => shark.kind === 'manta'), 'the selected species is rendered');

  document.hidden = true;
  documentEvents.emit('visibilitychange');
  assert.equal(frames.size, 0, 'hidden tab releases its animation callback');
  const hiddenPaints = paints;
  advance(60_000);
  assert.equal(paints, hiddenPaints, 'hidden tab does no background drawing');
  document.hidden = false;
  documentEvents.emit('visibilitychange');
  assert.equal(frames.size, 1, 'visible tab resumes one loop');
  advance(16);

  intersectionObservers[0].fn([{ isIntersecting: false }]);
  assert.equal(frames.size, 0, 'off-screen canvas releases its animation callback');
  intersectionObservers[0].fn([{ isIntersecting: true }]);
  engine.setOptions({ language: 'zh' });
  engine.setOptions({ opacity: 0.6 });
  assert.equal(frames.size, 1, 'resume and settings updates do not duplicate the loop');
  advance(16);
  engine.setOptions({ reducedMotion: true });
  assert.equal(frames.size, 0, 'reduced motion keeps a still frame');
  const stillPaints = paints;
  parent.clientWidth = 1280;
  resizeObservers[0].fn();
  assert.equal(canvas.width, 1280);
  assert.equal(paints, stillPaints + 1, 'resizing repaints the reduced-motion bitmap instead of leaving it blank');
  assert.equal(frames.size, 0, 'static resize does not start an animation loop');
  motion.matches = false;
  motion.emit('change');
  assert.equal(frames.size, 1, 'motion preference change resumes animation');
  engine.stop();
  assert.equal(frames.size, 0, 'stop cancels pending animation');
  assert.ok(resizeObservers[0].disconnected && intersectionObservers[0].disconnected, 'observers are disposed');
  for (const source of [documentEvents, fonts, windowEvents, motion]) {
    assert.equal([...source.listeners.values()].reduce((sum, set) => sum + set.size, 0), 0, 'event listeners are removed');
  }
} finally {
  for (const [key, descriptor] of savedGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
}
console.log('test-character-ocean: 33 frozen silhouette fixtures, raster/font caches and invalidation, visibility, motion, resize and disposal passed');
