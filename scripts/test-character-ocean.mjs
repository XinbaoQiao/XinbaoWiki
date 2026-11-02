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
const { DEFAULT_CHARACTER_OCEAN, parseCharacterOceanSettings } = loadTypeScript('lib/site-character-ocean.ts');
assert.equal(parseCharacterOceanSettings(null).density, 0.7);
assert.equal(parseCharacterOceanSettings(null).opacity, 0.65);
const upgraded = parseCharacterOceanSettings(JSON.stringify({ style: 'hanzi', density: 1, opacity: 0.92 }));
assert.equal(upgraded.style, 'hanzi');
assert.equal(upgraded.density, DEFAULT_CHARACTER_OCEAN.density);
assert.equal(upgraded.opacity, DEFAULT_CHARACTER_OCEAN.opacity);
assert.equal(parseCharacterOceanSettings(JSON.stringify({ ...upgraded, density: 1, opacity: 0.92 })).opacity, 0.92, 'a later explicit old-value choice remains intact');
assert.equal(parseCharacterOceanSettings(JSON.stringify({ style: 'ascii', density: 0.9, opacity: 0.8 })).density, 0.9, 'custom settings remain intact');
assert.equal(parseCharacterOceanSettings(JSON.stringify({ style: 'off', density: 1, opacity: 0.92 })).style, 'off', 'saved opt-out remains off');
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
    window: { ...windowEvents, dispatchEvent: event => windowEvents.emit(event.type, event), requestAnimationFrame: fn => globalThis.requestAnimationFrame(fn), cancelAnimationFrame: id => globalThis.cancelAnimationFrame(id), innerWidth: 1440, innerHeight: 1000, devicePixelRatio: 1, matchMedia: () => motion },
    document: { ...documentEvents, documentElement: root, fonts, hidden: false, querySelectorAll: () => [text] },
    performance: { now: () => now },
    getComputedStyle: () => ({ visibility: 'visible', display: 'block', opacity: '1', contentVisibility: 'visible', getPropertyValue: () => '' }),
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
  assert.equal(engine.fadeAt(200, 200), 0.04, 'text cores retain only four percent of fish ink');
  assert.ok(Math.abs(engine.fadeAt(169.9, 220) - engine.fadeAt(170, 220)) < 0.0001, 'text halo meets its core continuously');
  assert.equal(engine.fadeAt(1000, 600), 1, 'open water retains full ink');
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

  const { World, RIPPLE_SPEED_CAP } = loadTypeScript('lib/character-ocean/world.ts');
  const { SPECIES } = loadTypeScript('lib/character-ocean/species.ts');
  const world = new World(); world.resize(1440, 1000, 10, 14);
  const shark = world.sharks[0];
  shark.kind = 'classic'; shark.length = 100; shark.heading = Math.PI; shark.speed = 34;
  for (let i = 0; i < 20; i++) { shark.nodes[i * 2] = 1100; shark.nodes[i * 2 + 1] = 500; }
  const fish = { ...world.fish[0], x: 1100, y: 500, vx: 0, vy: 20, alarm: 0, species: 0 };
  world.sharks = [shark]; world.fish = [fish];
  world.addRipple({ x: 720, y: 500, bornMs: now, waveSpeed: 158, durationMs: 2850 });
  now += 2000;
  world.applyRippleBoosts(0);
  assert.equal(shark.rippleBoost, 0, 'no distant sprint before the visible wave arrives');
  assert.equal(fish.alarm, 0, 'schools do not receive an early global kick');
  now += 400;
  world.applyRippleBoosts(0);
  assert.equal(shark.rippleBoost, 1, 'scroll-wave contact accelerates large fish outside the old capped steering radius');
  assert.equal(shark.speed, 34 * RIPPLE_SPEED_CAP, 'large fish have a bounded sprint');
  assert.ok(fish.vx > 0 && Math.hypot(fish.vx, fish.vy) > 20, 'small fish flee outward and accelerate on wave contact');
  const hitVelocity = [fish.vx, fish.vy];
  world.applyRippleBoosts(0);
  assert.deepEqual([fish.vx, fish.vy], hitVelocity, 'the same wave cannot kick again every frame');
  for (let i = 0; i < 60; i++) world.stepSharks(1 / 60);
  assert.ok(Math.cos(shark.heading) > 0, 'an inward-facing large fish turns away from the wave origin');
  assert.ok(shark.speed <= 34 * RIPPLE_SPEED_CAP);
  world.addRipple({ x: 720, y: 500, bornMs: now - 2400, waveSpeed: 158, durationMs: 2850 });
  world.applyRippleBoosts(0);
  assert.ok(Math.hypot(fish.vx, fish.vy) <= SPECIES[0].maxSpeed * 2.8 + 1e-8, 'overlapping waves cannot stack unbounded school speed');
  now += 3000;
  world.applyRippleBoosts(1);
  assert.equal(world.ripples.length, 0, 'expired waves stop interacting');
  assert.ok(shark.rippleBoost < 1, 'sprint energy coasts down after the wave');

  const waveEngine = createCharacterOceanEngine(canvas, { style: 'ascii', language: 'en', reducedMotion: false });
  const { startHomeLeaveRipple } = loadTypeScript('lib/home-leave-ripple.ts');
  const disposeWave = startHomeLeaveRipple(canvas);
  const shared = waveEngine.world.ripples.find(r => r.shared);
  assert.ok(shared, 'the actual home leave painter broadcasts to the ocean engine');
  assert.equal(shared.waveSpeed, 158); assert.equal(shared.durationMs, 2850);
  assert.equal(shared.x, 690); assert.equal(shared.y, 460);
  const nextPageEngine = createCharacterOceanEngine(canvas, { style: 'ascii', language: 'en', reducedMotion: false });
  assert.equal(nextPageEngine.world.ripples[0]?.bornMs, shared.bornMs, 'a route-mounted engine resumes the same wave clock');
  const reducedEngine = createCharacterOceanEngine(canvas, { style: 'ascii', language: 'en', reducedMotion: true });
  assert.equal(reducedEngine.world.ripples.length, 0, 'reduced motion ignores animated waves');
  disposeWave();
  assert.ok(waveEngine.world.ripples.every(r => !r.shared), 'aborting the visual wave removes its simulation influence');
  waveEngine.stop(); nextPageEngine.stop(); reducedEngine.stop();
  for (const source of [documentEvents, fonts, windowEvents, motion]) {
    assert.equal([...source.listeners.values()].reduce((sum, set) => sum + set.size, 0), 0, 'shared wave subscriptions are disposed');
  }
} finally {
  for (const [key, descriptor] of savedGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
}
console.log('test-character-ocean: 33 frozen silhouette fixtures, raster/font caches and invalidation, visibility, motion, resize and disposal passed');
