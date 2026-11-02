import { expect, test } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
test.use({ reducedMotion: 'no-preference', userAgent: 'xinbaopedia-deployment-browser-qa/1' });
test.beforeEach(async ({ page }) => {
  await page.route(url => url.pathname === `${basePath}/api/site-activity/v2/`, route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify(route.request().method() === 'POST' ? {} : {
      cells: [], enabled: false, generatedAt: '2026-11-02T00:00:00Z',
      period: { scope: 'lifetime', since: '2026-08-09' }, schemaVersion: 2,
      thresholds: { cell: 2, total: 2 }, uniqueBrowsersEstimate: null
    })
  }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://*.public.blob.vercel-storage.com/site-wallpaper/**', route => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'),
  }));
});

for (const width of [1440, 390]) {
  test(`reversing a disclosure keeps the new animation's height pin at ${width}px`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const news = page.locator('#portal-news');
    const sample = await news.evaluate(async element => {
      const summary = element.querySelector(':scope > summary');
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      summary.click();
      await wait(90);
      summary.click();
      await wait(70);
      summary.click();
      const frames = [];
      const start = performance.now();
      while (performance.now() - start < 230) {
        await new Promise(requestAnimationFrame);
        frames.push({
          active: element.getAnimations().some(animation => animation.playState === 'running'),
          height: element.style.height,
          willChange: element.style.willChange,
          open: element.open,
          top: element.getBoundingClientRect().top
        });
      }
      return frames;
    });
    await testInfo.attach('reversal-frames', { body: JSON.stringify(sample), contentType: 'application/json' });
    const active = sample.filter(frame => frame.active);
    expect(active.length).toBeGreaterThan(2);
    expect(active.every(frame => frame.height && frame.willChange === 'height'), 'cancelled predecessors must not clear the successor height pin').toBe(true);
    await expect.poll(() => news.evaluate(element => element.getAnimations().length)).toBe(0);
    await expect(news).toHaveAttribute('open', '');
    await expect.poll(() => news.evaluate(element => element.style.height)).toBe('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('user wheel scrolling is preserved during a disclosure animation', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#portal-news > summary').click();
  await page.getByRole('button', { name: 'Full', exact: true }).click();
  await expect.poll(() => page.locator('#portal-news').evaluate(element => element.getAnimations().length)).toBe(0);
  await expect.poll(() => page.locator('.wiki-portal').evaluate(element => element.getAnimations().length)).toBe(0);
  await page.evaluate(() => scrollTo(0, 150));
  await page.mouse.move(20, 350);
  const sample = await page.evaluate(async () => {
    document.querySelector('#portal-directory > summary').click();
    const before = scrollY;
    await new Promise(resolve => setTimeout(resolve, 70));
    // Deliver wheel intent and its scroll in the same browser turn, so driver
    // latency cannot move the gesture past the end of the animation.
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
    window.scrollBy(0, 100);
    const frames = [];
    for (let i = 0; i < 6; i++) {
      await new Promise(requestAnimationFrame);
      frames.push(scrollY);
    }
    return { before, frames };
  });
  expect(sample.before).toBeGreaterThan(1);
  expect(Math.min(...sample.frames), 'the animation must not repeatedly restore the old scroll position after user input').toBeGreaterThan(sample.before + 30);
  await expect(page).toHaveURL(/\/$/);
});

test('switching to reduced motion during a reversal clears the height pin', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const news = page.locator('#portal-news');
  await news.locator(':scope > summary').click();
  await page.waitForTimeout(70);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await news.locator(':scope > summary').click();
  await expect(news).not.toHaveAttribute('open', '');
  await expect.poll(() => news.evaluate(element => element.style.height)).toBe('');
  expect(await news.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
});
