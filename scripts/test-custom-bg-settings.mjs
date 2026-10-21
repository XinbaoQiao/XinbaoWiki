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

function panelAlphaForOverlay(overlayPercent) {
  const overlay = clampOverlay(overlayPercent) / 100;
  if (overlay <= 0) return 0;
  return Math.min(0.92, 0.22 + overlay * 0.7);
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
assert.equal(panelAlphaForOverlay(0), 0);
assert.ok(panelAlphaForOverlay(48) > 0.4 && panelAlphaForOverlay(48) < 0.7);
assert.ok(Math.abs(panelAlphaForOverlay(100) - 0.92) < 1e-9);

assert.deepEqual(parseCustomBgSettings(JSON.stringify({
  enabled: true,
  mode: 'soft-fade',
  overlay: 0,
  position: 'top'
})), {
  enabled: true,
  mode: 'soft-fade',
  overlay: 0,
  position: 'top'
});

console.log('test-custom-bg-settings: ok');

