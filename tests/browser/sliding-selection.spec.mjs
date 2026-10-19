import { expect, test } from '@playwright/test';

const activityPath = `${(process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')}/api/site-activity/v2/`;

test.beforeEach(async ({ page }) => {
  await page.route(url => url.pathname === activityPath, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(route.request().method() === 'POST' ? {} : {
      cells: [], enabled: false, generatedAt: '2026-10-19T03:00:00Z',
      period: { scope: 'lifetime', since: '2026-08-09' }, schemaVersion: 2,
      thresholds: { cell: 2, total: 2 }, uniqueBrowsersEstimate: null
    })
  }));
});

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  return errors;
}

async function expectAligned(control, dots = false) {
  await expect(control).toHaveAttribute('data-selection-ready', '');
  await expect.poll(() => control.evaluate((root, isDots) => {
    const button = root.querySelector('button[aria-pressed="true"]');
    const bounds = button.getBoundingClientRect();
    const container = root.getBoundingClientRect();
    const style = getComputedStyle(root, '::before');
    const matrix = new DOMMatrixReadOnly(style.transform);
    const x = bounds.left - container.left - root.clientLeft;
    const y = bounds.top - container.top - root.clientTop;
    return Math.max(
      Math.abs(matrix.m41 - (isDots ? x + bounds.width / 2 - 3.75 : x)),
      Math.abs(matrix.m42 - (isDots ? y + bounds.height / 2 - 3.75 : y)),
      Math.abs(parseFloat(style.width) - (isDots ? 7.5 : bounds.width)),
      Math.abs(parseFloat(style.height) - (isDots ? 7.5 : bounds.height))
    );
  }, dots)).toBeLessThan(1);
}

// Sample computed frames, so this proves visible motion rather than a CSS declaration.
async function sampleSwitch(control, targetIndex, reverse = false) {
  return control.evaluate(async (root, options) => {
    const buttons = root.querySelectorAll('button');
    const read = () => {
      const style = getComputedStyle(root, '::before');
      return { x: new DOMMatrixReadOnly(style.transform).m41, duration: style.transitionDuration };
    };
    const originalIndex = [...buttons].findIndex(button => button.getAttribute('aria-pressed') === 'true');
    const start = read();
    buttons[options.targetIndex].click();
    const frames = [];
    let reversed = false;
    const started = performance.now();
    while (performance.now() - started < 480) {
      await new Promise(requestAnimationFrame);
      frames.push(read());
      if (options.reverse && !reversed && Math.abs(frames.at(-1).x - start.x) > 3) {
        buttons[originalIndex].click();
        reversed = true;
      }
    }
    return { start, frames, reversed };
  }, { targetIndex, reverse });
}

function expectMotion(sample) {
  const end = sample.frames.at(-1).x;
  const low = Math.min(sample.start.x, end);
  const high = Math.max(sample.start.x, end);
  expect(high - low).toBeGreaterThan(20);
  expect(sample.frames.some(frame => frame.x > low + 1 && frame.x < high - 1)).toBe(true);
  expect(sample.frames.some(frame => frame.duration.includes('0.32s'))).toBe(true);
}

test.describe('Shared selection motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('language, updates and browse highlights move, reverse and stay aligned after layout changes', async ({ page }, testInfo) => {
    const errors = captureErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    const language = page.locator('.wiki-search-language-seg');
    await expectAligned(language);
    const languageMotion = await sampleSwitch(language, 1);
    expectMotion(languageMotion);
    await expectAligned(language);
    const reversal = await sampleSwitch(language, 0, true);
    expect(reversal.reversed).toBe(true);
    expect(reversal.frames.some(frame => frame.x < reversal.start.x - 3)).toBe(true);
    expect(Math.abs(reversal.frames.at(-1).x - reversal.start.x)).toBeLessThan(1);
    await expectAligned(language);
    await language.getByRole('button', { name: 'EN', exact: true }).click();

    await page.locator('#portal-news > summary').click();
    const updates = page.locator('.wiki-portal-updates-view-switcher .wiki-sliding-selection');
    await expectAligned(updates);
    const updatesMotion = await sampleSwitch(updates, 1);
    expectMotion(updatesMotion);
    await expectAligned(updates);
    await page.locator('#portal-news > summary').click();
    await page.locator('#portal-news > summary').click();
    await expectAligned(updates);
    await expect(updates.getByRole('button', { name: 'Detailed', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#portal-directory > summary').click();
    const browse = page.locator('#portal-directory .wiki-portal-view-switcher .wiki-sliding-selection');
    await expectAligned(browse);
    const browseMotion = await sampleSwitch(browse, 1);
    expectMotion(browseMotion);
    await expectAligned(browse);
    const list = browse.getByRole('button', { name: 'List', exact: true });
    await list.focus();
    await page.keyboard.press('Space');
    await expect(list).toBeFocused();
    await expect(list).toHaveAttribute('aria-pressed', 'true');
    expect(await list.evaluate(button => getComputedStyle(button).outlineStyle)).not.toBe('none');
    await expectAligned(browse);

    await language.getByRole('button', { name: '中文', exact: true }).click();
    await expectAligned(updates);
    await expectAligned(browse);
    await page.setViewportSize({ width: 320, height: 1000 });
    await expectAligned(language);
    await expectAligned(updates);
    await expectAligned(browse);
    await page.setViewportSize({ width: 1440, height: 1200 });
    await expectAligned(language);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    await testInfo.attach('sampled-motion', {
      body: Buffer.from(JSON.stringify({ languageMotion, reversal, updatesMotion, browseMotion }, null, 2)),
      contentType: 'application/json'
    });
  });

  test.describe('Touch', () => {
    test.use({ viewport: { width: 390, height: 1000 }, hasTouch: true, isMobile: true });

    test('touch angle marker slides to the selected view at narrow width', async ({ page }) => {
      const errors = captureErrors(page);
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.locator('#portal-directory > summary').tap();
      await page.getByRole('group', { name: 'Browse view', exact: true }).getByRole('button', { name: 'Cube', exact: true }).tap();
      const angles = page.getByRole('group', { name: 'Cube viewing angle', exact: true });
      await expectAligned(angles, true);
      expectMotion(await sampleSwitch(angles, 2));
      await expectAligned(angles, true);
      await expect(page.locator('.wiki-portal-cube-stage-cube')).toHaveAttribute('data-touch-cube-angle', 'right');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  });
});

test('reduced motion snaps the selection into place', async ({ page }) => {
  const errors = captureErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const language = page.locator('.wiki-search-language-seg');
  await expectAligned(language);
  const sample = await sampleSwitch(language, 1);
  expect([...new Set(sample.frames.map(frame => frame.duration))]).toEqual(['0s']);
  expect(sample.frames.every(frame => Math.abs(frame.x - sample.frames.at(-1).x) < 1)).toBe(true);
  await expectAligned(language);
  await page.locator('#portal-news > summary').click();
  const updates = page.locator('.wiki-portal-updates-view-switcher .wiki-sliding-selection');
  const updateSample = await sampleSwitch(updates, 1);
  expect(updateSample.frames.every(frame => frame.duration === '0s')).toBe(true);
  await expectAligned(updates);
  expect(errors).toEqual([]);
});
