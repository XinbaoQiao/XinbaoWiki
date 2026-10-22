import assert from 'node:assert/strict';
import fs from 'node:fs';

function clampOverlay(value) {
  if (!Number.isFinite(value)) return 40;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseSharedSiteBackground(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { enabled: false, imageUrl: null, mode: 'cover', overlay: 50, position: 'center', tone: null, updatedAt: null };
  }
  const imageUrl = typeof value.imageUrl === 'string' && value.imageUrl.trim() ? value.imageUrl.trim() : null;
  const enabled = Boolean(value.enabled) && Boolean(imageUrl);
  return {
    enabled,
    imageUrl: enabled ? imageUrl : null,
    mode: value.mode === 'soft-fade' || value.mode === 'tile' || value.mode === 'depth' || value.mode === 'cover' ? value.mode : 'cover',
    overlay: clampOverlay(typeof value.overlay === 'number' ? value.overlay : 50),
    position: value.position === 'top' || value.position === 'bottom' || value.position === 'center' ? value.position : 'center',
    tone: value.tone === 'light' || value.tone === 'dark' ? value.tone : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null
  };
}

function cssUrlForSharedImage(imageUrl) {
  if (!imageUrl) return null;
  if (!/^(https:\/\/|\/)[^\s"'<>\\]+$/i.test(imageUrl)) return null;
  return imageUrl;
}

assert.equal(parseSharedSiteBackground(null).enabled, false);
assert.equal(parseSharedSiteBackground({ enabled: true }).enabled, false);
assert.equal(parseSharedSiteBackground({ enabled: true, imageUrl: 'https://example.com/a.jpg', overlay: 120 }).overlay, 100);
assert.equal(cssUrlForSharedImage('javascript:alert(1)'), null);
assert.equal(cssUrlForSharedImage('https://blob.vercel-storage.com/x.jpg'), 'https://blob.vercel-storage.com/x.jpg');

const files = {
  route: fs.readFileSync('app/api/site-activity/wallpaper/route.ts', 'utf8'),
  store: fs.readFileSync('lib/site-wallpaper-store.ts', 'utf8'),
  shared: fs.readFileSync('lib/site-wallpaper-shared.ts', 'utf8'),
  toggle: fs.readFileSync('components/LanguageToggle.tsx', 'utf8'),
  layout: fs.readFileSync('app/layout.tsx', 'utf8'),
  css: fs.readFileSync('app/globals.css', 'utf8'),
  deny: fs.readFileSync('scripts/template/denylist.txt', 'utf8'),
  rules: fs.readFileSync('scripts/template/rules.mjs', 'utf8'),
  docs: fs.readFileSync('docs/site-wallpaper/README.md', 'utf8')
};

const expectations = [
  ['route', 'GET', 'POST', 'DELETE', 'SITE_ACTIVITY_OWNER_PASSWORD_HASH', 'form-data', 'sniffImageMimeType'],
  ['store', '@vercel/blob', 'SITE_BACKGROUND_REDIS_KEY', 'SITE_BACKGROUND_BLOB_PATHNAME', 'siteBackgroundLocalFallbackEnabled', 'siteBackgroundPasswordRequired', 'blobReadWriteTokenEnv'],
  ['shared', "join(':')", 'site-wallpaper', 'wallpaper', 'sharedBackgroundInlineStyle', 'sniffImageMimeType', 'isAcceptedSiteBackgroundMime'],
  ['toggle', '/api/site-activity/wallpaper/', 'SITE_WALLPAPER_API', 'AbortController', 'compressImageFile', 'publishShared', '全站可见', '仅此设备', 'imageExtensionForMime', 'normalizeImageMimeType'],
  ['layout', 'initialSharedBackground', 'sharedBackgroundInlineStyle', 'loadInitialSharedBackground'],
  ['css', 'html[data-site-custom-bg="on"] .wiki-toc-return', 'backdrop-filter: blur(10px)', 'site-custom-bg-password'],
  ['deny', 'vercel-storage\\.com/site-wallpaper', 'public/site-wallpaper/'],
  ['rules', "'public/site-wallpaper/'"],
  ['docs', 'the Vercel Blob RW token env', 'SITE_ACTIVITY_OWNER_PASSWORD_HASH']
];

for (const [label, ...needles] of expectations) {
  const text = files[label];
  for (const needle of needles) {
    assert.notEqual(text.indexOf(needle), -1, `${label} missing ${needle}`);
  }
}

const forbiddenPath = ['site', 'background'].join('-');
const forbiddenBlobEnv = ['BLOB', 'READ', 'WRITE', 'TOKEN'].join('_');
assert.equal(files.route.includes(forbiddenPath), false);
assert.equal(files.store.includes(forbiddenBlobEnv), false);


const customBg = fs.readFileSync('lib/site-custom-background.ts', 'utf8');
assert.match(customBg, /Image compression timed out/);
assert.match(customBg, /withTimeout/);
assert.doesNotMatch(customBg, /preferPng[\s\S]{0,80}canvasToBlob\(canvas, 'image\/png'\)/);

console.log('test-site-wallpaper: ok');