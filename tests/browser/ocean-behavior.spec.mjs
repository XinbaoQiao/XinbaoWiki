import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const modules = {};
function bundle(relative) {
  const key = path.resolve(relative);
  if (modules[key]) return key;
  const code = ts.transpileModule(fs.readFileSync(key, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  modules[key] = { code, dependencies: {} };
  for (const match of code.matchAll(/require\("(@\/[^"\n]+)"\)/g)) modules[key].dependencies[match[1]] = bundle(`${match[1].replace('@/', '')}.ts`);
  return key;
}
const entry = bundle('lib/character-ocean/engine.ts');
async function install(page) {
  await page.evaluate(({ modules, entry }) => {
    const cache = new Map();
    function load(key) {
      if (cache.has(key)) return cache.get(key).exports;
      const module = { exports: {} }; cache.set(key, module);
      const source = modules[key];
      new Function('require', 'module', 'exports', source.code)(name => load(source.dependencies[name]), module, module.exports);
      return module.exports;
    }
    window.makeTestOcean = load(entry).createCharacterOceanEngine;
  }, { modules, entry });
}
test.use({ reducedMotion: 'no-preference', userAgent: 'mywiki-deployment-browser-qa/1' });
test.beforeEach(async ({ page }, testInfo) => {
  if (!testInfo.title.startsWith('ocean settings:')) await page.addInitScript(() => localStorage.setItem('mywiki-character-ocean', JSON.stringify({ style: 'off' })));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://example.com/site-wallpaper/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') }));
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
  await page.route(url => url.pathname === `${basePath}/api/site-activity/v2/`, route => route.fulfill({ json: { cells: [], enabled: false, schemaVersion: 2, uniqueBrowsersEstimate: null } }));
});

for (const scenario of [
  { name: 'new visitor', saved: null, density: 0.7, opacity: 0.65 },
  { name: 'previous defaults', saved: { style: 'ascii', density: 1, opacity: 0.92 }, density: 0.7, opacity: 0.65 },
  { name: 'custom settings', saved: { style: 'ascii', density: 0.9, opacity: 0.8 }, density: 0.9, opacity: 0.8 }
]) {
  test(`ocean settings: ${scenario.name}`, async ({ page }) => {
    await page.addInitScript(saved => {
      if (saved) localStorage.setItem('mywiki-character-ocean', JSON.stringify(saved));
      else localStorage.removeItem('mywiki-character-ocean');
    }, scenario.saved);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('.site-character-ocean-canvas')).toHaveCSS('opacity', String(scenario.opacity));
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mywiki-character-ocean')));
    expect(saved.density).toBe(scenario.density);
    expect(saved.opacity).toBe(scenario.opacity);
    expect(saved.defaultsVersion).toBe(2);
  });
}

test('native canvas strongly fades both fish sizes in text across all ocean styles', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.setContent('<div style="position:fixed;inset:0"><canvas></canvas></div><p style="position:fixed;left:300px;top:200px;width:400px;height:1500px">Reading area (long text continues below the fold)</p>');
  await install(page);
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const out = [];
    for (const style of ['ascii', 'type', 'braille', 'blocks', 'geometry', 'lines', 'hanzi']) {
      const engine = window.makeTestOcean(canvas, { style, language: style === 'hanzi' ? 'zh' : 'en', reducedMotion: false });
      engine.stop();
      const fish = { ...engine.world.fish[0], vx: 20, vy: 0, alive: true };
      const shark = engine.world.sharks[0]; shark.length = 100; shark.kind = 'classic';
      const peak = (kind, x, y) => {
        engine.world.fish = kind === 'small' ? [{ ...fish, x, y }] : [];
        engine.world.sharks = kind === 'large' ? [shark] : [];
        for (let i = 0; i < 20; i++) { shark.nodes[i * 2] = x - i * 5; shark.nodes[i * 2 + 1] = y; }
        engine.sharkRasterDirty = true;
        engine.draw(1000);
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let max = 0; for (let i = 3; i < data.length; i += 4) max = Math.max(max, data[i]);
        return max;
      };
      for (const kind of ['small', 'large']) out.push({ style, kind, masked: peak(kind, 450, 350), open: peak(kind, 1100, 700) });
    }
    return out;
  });
  await testInfo.attach('native-alpha', { body: JSON.stringify(result), contentType: 'application/json' });
  for (const row of result) {
    expect(row.open, `${row.style}/${row.kind} remains visible in open water`).toBeGreaterThan(20);
    expect(row.masked / row.open, `${row.style}/${row.kind} yields to text`).toBeLessThan(0.12);
  }
});

for (const route of ['/', '/wiki/Your_Name/']) {
  test(`real text is included in the shared ocean mask on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await install(page);
    const result = await page.evaluate(() => {
      const host = document.createElement('div'); host.style.cssText = 'position:fixed;inset:0;pointer-events:none';
      const canvas = document.createElement('canvas'); host.append(canvas); document.body.append(host);
      const engine = window.makeTestOcean(canvas, { style: 'ascii', language: 'en', reducedMotion: false });
      engine.stop(); engine.refreshContentRects();
      const text = document.querySelector('.wiki-portal-name') || document.querySelector('.wiki-body p');
      const rect = text.getBoundingClientRect();
      const fade = engine.fadeAt(rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 10));
      host.remove(); return { fade, width: rect.width };
    });
    expect(result.width).toBeGreaterThan(0);
    expect(result.fade).toBe(0.04);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('.wiki-toc-return')).toHaveCount(0);
  });
}

test('home scroll wave remains connected to an engine across intro navigation', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await install(page);
  await page.evaluate(() => {
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;inset:0;pointer-events:none';
    const canvas = document.createElement('canvas'); host.append(canvas); document.body.append(host);
    window.testOcean = window.makeTestOcean(canvas, { style: 'ascii', language: 'en', reducedMotion: false });
  });
  await page.locator('.wiki-home-scroll-intro-link').click();
  await expect(page).toHaveURL(/\/wiki\/Your_Name\/?$/);
  const wave = await page.evaluate(() => {
    const wave = window.testOcean.world.ripples.find(r => r.shared);
    window.testOcean.stop();
    return wave && { waveSpeed: wave.waveSpeed, durationMs: wave.durationMs };
  });
  expect(wave).toEqual({ waveSpeed: 158, durationMs: 2850 });
  await expect(page.locator('#wiki-on-this-page')).toHaveCount(1);
});
