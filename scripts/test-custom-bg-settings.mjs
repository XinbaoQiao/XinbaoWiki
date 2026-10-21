import assert from 'node:assert/strict';

const DEFAULT = {
  enabled: false,
  mode: 'cover',
  overlay: 48,
  position: 'center'
};

const MODES = new Set(['cover', 'soft-fade', 'tile', 'depth']);
const POSITIONS = new Set(['top', 'center', 'bottom']);
const CUSTOM_BG_INK_OVERLAY_THRESHOLD = 42;

function clampOverlay(value) {
  if (!Number.isFinite(value)) return DEFAULT.overlay;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function panelAlphaForOverlay(overlayPercent) {
  const overlay = clampOverlay(overlayPercent) / 100;
  if (overlay <= 0) return 0;
  return Math.min(0.92, 0.22 + overlay * 0.7);
}

function toneFromLuminance(luminance) {
  if (!Number.isFinite(luminance)) return 'light';
  return luminance < 0.45 ? 'dark' : 'light';
}

function inkForCustomBg(active, tone, overlayPercent) {
  if (!active || !tone) return 'none';
  if (tone === 'light') return 'dark';
  return clampOverlay(overlayPercent) >= CUSTOM_BG_INK_OVERLAY_THRESHOLD ? 'dark' : 'light';
}

assert.equal(toneFromLuminance(0.2), 'dark');
assert.equal(toneFromLuminance(0.7), 'light');
assert.equal(inkForCustomBg(true, 'dark', 0), 'light');
assert.equal(inkForCustomBg(true, 'dark', 42), 'dark');
assert.equal(inkForCustomBg(true, 'light', 0), 'dark');
assert.equal(inkForCustomBg(false, 'dark', 0), 'none');
assert.equal(panelAlphaForOverlay(0), 0);
assert.ok(Math.abs(panelAlphaForOverlay(100) - 0.92) < 1e-9);

console.log('test-custom-bg-settings: ok');
