import assert from 'node:assert/strict';

const DEFAULT = {
  enabled: false,
  mode: 'cover',
  overlay: 50,
  position: 'center'
};

const CUSTOM_BG_LUMINANCE_TONE_THRESHOLD = 0.45;

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
  return luminance < CUSTOM_BG_LUMINANCE_TONE_THRESHOLD ? 'dark' : 'light';
}

function inkForCustomBg(active, tone, _overlayPercent) {
  if (!active || !tone) return 'none';
  return tone === 'light' ? 'dark' : 'light';
}

function scrimRgbForTone(tone) {
  return tone === 'dark' ? '8 10 12' : '255 255 255';
}

assert.equal(DEFAULT.overlay, 50);
assert.equal(toneFromLuminance(0.2), 'dark');
assert.equal(toneFromLuminance(0.44), 'dark');
assert.equal(toneFromLuminance(0.45), 'light');
assert.equal(toneFromLuminance(0.7), 'light');
assert.equal(inkForCustomBg(true, 'dark', 0), 'light');
assert.equal(inkForCustomBg(true, 'dark', 100), 'light');
assert.equal(inkForCustomBg(true, 'light', 0), 'dark');
assert.equal(inkForCustomBg(true, 'light', 100), 'dark');
assert.equal(inkForCustomBg(false, 'dark', 0), 'none');
assert.equal(scrimRgbForTone('dark'), '8 10 12');
assert.equal(scrimRgbForTone('light'), '255 255 255');
assert.equal(panelAlphaForOverlay(0), 0);
assert.ok(Math.abs(panelAlphaForOverlay(100) - 0.92) < 1e-9);

console.log('test-custom-bg-settings: ok');
