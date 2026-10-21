import assert from 'node:assert/strict';

const DEFAULT = {
  enabled: false,
  mode: 'cover',
  overlay: 48,
  position: 'center'
};

const MODES = new Set(['cover', 'soft-fade', 'tile', 'depth']);
const POSITIONS = new Set(['top', 'center', 'bottom']);

function clampOverlay(value) {
  if (!Number.isFinite(value)) return DEFAULT.overlay;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseCustomBgSettings(raw) {
  if (!raw) return { ...DEFAULT };
  try {
    const parsed = JSON.parse(raw);
    return {
      enabled: Boolean(parsed.enabled),
      mode: MODES.has(parsed.mode) ? parsed.mode : DEFAULT.mode,
      overlay: clampOverlay(typeof parsed.overlay === 'number' ? parsed.overlay : DEFAULT.overlay),
      position: POSITIONS.has(parsed.position) ? parsed.position : DEFAULT.position
    };
  } catch {
    return { ...DEFAULT };
  }
}

assert.equal(clampOverlay(48), 48);
assert.equal(clampOverlay(-3), 0);
assert.equal(clampOverlay(140), 100);
assert.equal(clampOverlay(Number.NaN), DEFAULT.overlay);

assert.deepEqual(parseCustomBgSettings(JSON.stringify({
  enabled: true,
  mode: 'soft-fade',
  overlay: 55,
  position: 'top'
})), {
  enabled: true,
  mode: 'soft-fade',
  overlay: 55,
  position: 'top'
});

assert.deepEqual(parseCustomBgSettings('{not-json'), DEFAULT);

const bad = parseCustomBgSettings(JSON.stringify({ enabled: true, mode: 'stretch', overlay: 9, position: 'left' }));
assert.equal(bad.mode, DEFAULT.mode);
assert.equal(bad.position, DEFAULT.position);
assert.equal(bad.overlay, 9);

console.log('test-custom-bg-settings: ok');
