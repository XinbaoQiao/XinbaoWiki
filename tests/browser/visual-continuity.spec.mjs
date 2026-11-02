import { expect, test } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
test.use({ reducedMotion: 'no-preference', userAgent: 'mywiki-deployment-browser-qa/1' });
test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://example.com/site-wallpaper/**', route => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'),
  }));
  await page.route(url => url.pathname === `${basePath}/api/site-activity/v2/`, route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(route.request().method() === 'POST' ? {} : {
      cells: [], enabled: false, generatedAt: '2026-11-02T00:00:00Z',
      period: { scope: 'lifetime', since: '2026-08-09' }, schemaVersion: 2,
      thresholds: { cell: 2, total: 2 }, uniqueBrowsersEstimate: null
    })
  }));
});

for (const width of [1440, 390]) {
  test(`list and cube switches never collapse the panel or bounce the title at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#portal-directory > summary').click();
    await expect.poll(() => page.locator('.wiki-portal').evaluate(element => element.getAnimations().length)).toBe(0);
    await page.mouse.move(10, 10);
    for (const mode of ['Cube', 'List', 'Cube']) {
      const frames = await page.evaluate(async mode => {
        const stage = document.querySelector('.wiki-portal-cube-stage');
        const panel = stage.closest('details');
        const title = document.querySelector('.wiki-portal-name');
        const start = performance.now();
        const read = () => ({ t: performance.now() - start, height: panel.getBoundingClientRect().height, stageHeight: stage.getBoundingClientRect().height, y: title.getBoundingClientRect().top, pin: panel.style.height });
        const out = [read()];
        [...document.querySelectorAll('button')].find(button => button.textContent.trim() === mode).click();
        while (performance.now() - start < 950) { await new Promise(requestAnimationFrame); out.push(read()); }
        return out;
      }, mode);
      await testInfo.attach(`${mode}-switch-frames`, { body: JSON.stringify(frames), contentType: 'application/json' });
      const first = frames[0].height;
      const last = frames.at(-1).height;
      expect(frames.every(frame => frame.height >= Math.min(first, last) - 2 && frame.height <= Math.max(first, last) + 2), 'stage height must stay between its measured endpoints').toBe(true);
      expect(Math.abs(frames[1].height - first), 'the first painted frame must not jump straight to the new layout').toBeLessThan(Math.abs(last - first) * 0.35 + 2);
      const ys = frames.map(frame => frame.y);
      expect(Math.max(...ys) - Math.min(...ys), 'the title must not recenter against a transient empty stage').toBeLessThan(2);
      expect(frames.at(-1).pin, 'the view switch must release its height pin').toBe('');
      if (mode === 'Cube') expect(frames.at(-1).stageHeight).toBeCloseTo(width === 390 ? 320 : 820, 0);
    }
    const reversed = await page.locator('.wiki-portal-cube-stage').evaluate(async stage => {
      const panel = stage.closest('details');
      const select = mode => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === mode).click();
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      select('List'); await wait(70); select('Cube'); await wait(70); select('List');
      const frames = []; const start = performance.now();
      while (performance.now() - start < 250) {
        await new Promise(requestAnimationFrame);
        frames.push({ active: panel.getAnimations().some(animation => animation.playState === 'running'), pin: panel.style.height });
      }
      return frames;
    });
    expect(reversed.filter(frame => frame.active).length).toBeGreaterThan(2);
    expect(reversed.filter(frame => frame.active).every(frame => frame.pin), 'a cancelled view switch must not clear its successor height pin').toBe(true);
    await expect.poll(() => page.locator('#portal-directory').evaluate(panel => panel.style.height)).toBe('');
  });

  test(`switching to the cube during initial opening keeps one continuous height at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const frames = await page.locator('#portal-directory').evaluate(async panel => {
      panel.querySelector(':scope > summary').click();
      await new Promise(resolve => setTimeout(resolve, 90));
      const start = performance.now();
      const read = () => ({ t: performance.now() - start, h: panel.getBoundingClientRect().height, pin: panel.style.height });
      const out = [read()];
      [...panel.querySelectorAll('button')].find(button => button.textContent.trim() === 'Cube').click();
      while (performance.now() - start < 1000) { await new Promise(requestAnimationFrame); out.push(read()); }
      return out;
    });
    await testInfo.attach('opening-view-switch-frames', { body: JSON.stringify(frames), contentType: 'application/json' });
    const first = frames[0].h; const last = frames.at(-1).h;
    expect(frames.every(frame => frame.h >= Math.min(first, last) - 2 && frame.h <= Math.max(first, last) + 2), 'the original opening animation must not finish at an obsolete list height').toBe(true);
    const settled = frames.filter(frame => frame.t > 550).map(frame => frame.h);
    expect(Math.max(...settled) - Math.min(...settled)).toBeLessThan(2);
    expect(frames.at(-1).pin).toBe('');
  });

  test(`saved appearance and landing position are stable before hydration at ${width}px`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => {
      localStorage.setItem('mywiki-palette-mode', 'rose');
      localStorage.setItem('mywiki-character-ocean', JSON.stringify({ style: 'off' }));
      window.__appearanceFrames = [];
      const start = performance.now();
      const frame = () => {
        const name = document.querySelector('.wiki-portal-name');
        if (name && getComputedStyle(document.documentElement).getPropertyValue('--site-page-bg').trim()) {
          window.__appearanceFrames.push({ t: performance.now() - start, palette: document.documentElement.dataset.sitePalette, y: name.getBoundingClientRect().top });
        }
        if (performance.now() - start < 2400) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await page.route('**/_next/static/chunks/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 650));
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const frames = await page.evaluate(() => window.__appearanceFrames);
    await testInfo.attach('appearance-frames', { body: JSON.stringify(frames), contentType: 'application/json' });
    expect(frames.length).toBeGreaterThan(8);
    expect(frames.every(frame => frame.palette === 'rose'), 'the saved palette must be used from the first painted content frame').toBe(true);
    const ys = frames.map(frame => frame.y);
    expect(Math.max(...ys) - Math.min(...ys), 'hydration must not move the centered name').toBeLessThan(3);
    expect(errors).toEqual([]);
  });

  test(`restoring name-only view has no late position snap at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const portal = page.locator('.wiki-portal');
    await page.locator('.wiki-portal-name-button').click();
    await expect(portal).toHaveClass(/wiki-portal-name-only/);
    await expect.poll(() => portal.evaluate(element => element.getAnimations().length)).toBe(0);
    const frames = await portal.evaluate(async element => {
      const start = performance.now(); const out = [];
      element.querySelector('.wiki-portal-name-button').click();
      while (performance.now() - start < 850) {
        await new Promise(requestAnimationFrame);
        out.push({ t: performance.now() - start, y: element.querySelector('.wiki-portal-name').getBoundingClientRect().top, anims: element.getAnimations().length, pins: element.querySelectorAll('details[style*="height:"]').length });
      }
      return out;
    });
    await testInfo.attach('restore-frames', { body: JSON.stringify(frames), contentType: 'application/json' });
    expect(frames.every(frame => frame.pins === 0), 'already-closed sections must not create redundant height animations').toBe(true);
    const lastAnimated = frames.findLastIndex(frame => frame.anims > 0);
    expect(lastAnimated).toBeGreaterThan(0);
    expect(Math.abs(frames[lastAnimated + 1].y - frames[lastAnimated].y), 'the end of the FLIP must not snap to a different center').toBeLessThan(1.5);
    const settled = frames.filter(frame => frame.t > 600).map(frame => frame.y);
    expect(Math.max(...settled) - Math.min(...settled)).toBeLessThan(1.5);
  });
}

test('cold paper preview is complete on first expansion and does not arrive as a later height jump', async ({ page }, testInfo) => {
  await page.route('**/_next/static/chunks/**', async route => {
    const response = await route.fetch({ timeout: 15_000 });
    const body = await response.text();
    if (body.includes('data-paper-acceptance')) await new Promise(resolve => setTimeout(resolve, 1200));
    await route.fulfill({ response, body });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.wiki-search-language-seg[data-selection-ready]');
  const frames = await page.locator('#portal-news').evaluate(async element => {
    const out = []; const start = performance.now();
    element.querySelector(':scope > summary').click();
    while (performance.now() - start < 1800) {
      await new Promise(requestAnimationFrame);
      out.push({ t: performance.now() - start, height: element.getBoundingClientRect().height, loaded: Boolean(element.querySelector('[data-paper-acceptance]')) });
    }
    return out;
  });
  await testInfo.attach('cold-preview-frames', { body: JSON.stringify(frames), contentType: 'application/json' });
  expect(frames[0].loaded, 'preview code and its CSS must be ready with the homepage').toBe(true);
  const settled = frames.filter(frame => frame.t > 800).map(frame => frame.height);
  expect(Math.max(...settled) - Math.min(...settled), 'late chunk arrival must not abruptly expand the page after the animation').toBeLessThan(2);
});

test('intro navigation and browser back leave a visible, stable title', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('.wiki-home-scroll-intro-link').click();
  await expect(page).toHaveURL(/\/wiki\/Your_Name\/?$/);
  const title = page.locator('h1.wiki-title');
  await expect(title).toBeVisible();
  await expect.poll(() => title.evaluate(element => getComputedStyle(element).opacity)).toBe('1');
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.wiki-portal-name')).toBeVisible();
  expect(errors).toEqual([]);
});
