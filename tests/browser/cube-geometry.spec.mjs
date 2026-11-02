import { expect, test } from '@playwright/test';

const faces = ['top', 'front', 'right'];
const geometryKeys = ['left', 'right', 'top', 'bottom', 'width', 'height'];
const tolerancePx = 0.2;

function expectNear(actual, expected, message) {
  expect(Math.abs(actual - expected), message).toBeLessThanOrEqual(tolerancePx);
}

test('fixed cube faces share the Latest Updates track and an icon-only Pin', async ({ browser, baseURL }, testInfo) => {
  const results = [];

  for (const face of faces) {
    const context = await browser.newContext({
      baseURL,
      reducedMotion: 'reduce',
      userAgent: 'mywiki-deployment-browser-qa/1',
      viewport: { width: 1440, height: 1200 },
    });
    const page = await context.newPage();
    const errors = [];
    const bufferedPrefetches = new Map();
    const completedPrefetchAborts = [];
    const pendingRequests = new Set();
    page.on('request', request => pendingRequests.add(request));
    page.on('requestfinished', request => pendingRequests.delete(request));

    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
    page.on('requestfailed', (request) => {
      pendingRequests.delete(request);
      const buffered = bufferedPrefetches.get(request);
      if (buffered && request.failure()?.errorText === 'net::ERR_ABORTED') {
        // This exact RSC request already returned a complete successful body.
        // Next may cancel its accepted prefetch; retain the cancellation receipt.
        completedPrefetchAborts.push(buffered);
        return;
      }
      errors.push(`request: ${request.url()} (${request.failure()?.errorText || 'failed'})`);
    });
    const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
    await page.route(url => url.pathname === `${basePath}/api/site-activity/v2/`, route => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(route.request().method() === 'POST' ? {} : {
        cells: [], enabled: false, schemaVersion: 2, uniqueBrowsersEstimate: null
      })
    }));
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    // Layout-only fixture: serve the wallpaper resource reported by requestfailed
    // locally, so provider availability does not change cube geometry coverage.
    await page.route('https://example.com/site-wallpaper/**', route => route.fulfill({
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'),
    }));
    // Buffer the real RSC payload for this geometry-only fixture. Chrome can
    // otherwise report an aborted stream after Next has accepted the prefetch.
    // Navigation tests still exercise the unmodified streaming transport.
    await page.route(url => url.origin === new URL(baseURL).origin && url.pathname.startsWith(`${basePath}/wiki/`) && url.searchParams.has('_rsc'), async route => {
      const response = await route.fetch({ timeout: 15_000 });
      const body = await response.body();
      expect(response.ok(), `prefetch ${route.request().url()} succeeds`).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      bufferedPrefetches.set(route.request(), { url: route.request().url(), status: response.status(), bytes: body.length });
      try {
        await route.fulfill({ response, body });
      } catch (error) {
        if (route.request().failure()?.errorText !== 'net::ERR_ABORTED') throw error;
      }
    });
    await page.addInitScript((selectedFace) => {
      window.localStorage.setItem('mywiki-browse-view', 'cube');
      window.localStorage.setItem('mywiki-cube-pinned-face', selectedFace);
    }, face);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#portal-directory > summary').click({ force: true });
    await page.waitForFunction((selectedFace) => {
      const directory = document.querySelector('#portal-directory');
      const stage = document.querySelector('.wiki-portal-cube-stage');
      return directory?.hasAttribute('open')
        && stage?.getAttribute('data-active-face') === selectedFace
        && stage.hasAttribute('data-face-settled');
    }, face);
    await expect.poll(() => page.locator(`.wiki-portal-cube-face-${face}`).evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(100);

    const result = await page.evaluate((selectedFace) => {
      const requireElement = (selector) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`missing ${selector}`);
        return element;
      };
      const rect = (element) => {
        const box = element.getBoundingClientRect();
        return Object.fromEntries(
          ['left', 'right', 'top', 'bottom', 'width', 'height']
            .map((key) => [key, Number(box[key].toFixed(3))])
        );
      };
      const updates = requireElement('.wiki-portal-timeline');
      const panel = requireElement(`.wiki-portal-cube-face-${selectedFace}`);
      const button = requireElement('.wiki-portal-cube-pin');
      const icon = requireElement('.wiki-portal-cube-pin-icon');
      const needle = requireElement('.wiki-portal-cube-pin-needle');
      const firstLink = panel.querySelector('a');
      if (!firstLink) throw new Error(`missing link on ${selectedFace}`);
      const buttonBox = button.getBoundingClientRect();
      const linkBox = firstLink.getBoundingClientRect();

      return {
        ariaLabel: button.getAttribute('aria-label'),
        button: rect(button),
        children: [...button.children].map((child) => child.tagName.toLowerCase()),
        face: selectedFace,
        icon: rect(icon),
        linkHit: document.elementFromPoint(linkBox.left + 10, linkBox.top + linkBox.height / 2)?.closest('a') === firstLink,
        needle: rect(needle),
        needlePaperGap: Number((needle.getBoundingClientRect().bottom - panel.getBoundingClientRect().top).toFixed(3)),
        panel: rect(panel),
        pinHit: document.elementFromPoint(buttonBox.left + buttonBox.width / 2, buttonBox.top + buttonBox.height / 2)?.closest('.wiki-portal-cube-pin') === button,
        text: button.textContent.trim(),
        updates: rect(updates),
      };
    }, face);
    // Let buffered prefetch handlers finish before disposing their request
    // context. Waiting keeps real errors observable rather than suppressing them.
    await expect.poll(() => pendingRequests.size, { message: 'geometry prefetches finish before teardown' }).toBe(0);
    await page.unrouteAll({ behavior: 'wait' });
    result.errors = [...errors];
    result.completedPrefetchAborts = [...completedPrefetchAborts];
    results.push(result);
    // Closing this test-owned context intentionally aborts its pending prefetches.
    // Preserve those failures separately, matched to the exact active URLs.
    const expectedShutdown = new Set([...pendingRequests].map(request => `request: ${request.url()} (net::ERR_ABORTED)`));
    await context.close();
    result.teardownErrors = errors.slice(result.errors.length);
    expect(result.teardownErrors.every(error => expectedShutdown.has(error)), 'only known pending requests may be aborted by context shutdown').toBe(true);
  }

  await testInfo.attach('cube-geometry.json', {
    body: Buffer.from(JSON.stringify(results, null, 2)),
    contentType: 'application/json',
  });
  console.log(`cube-geometry: ${JSON.stringify(results)}`);

  const baseline = results[0];
  for (const result of results) {
    expect(result.text, `${result.face} Pin has no visible label`).toBe('');
    expect(result.children, `${result.face} Pin contains only its image`).toEqual(['svg']);
    expect(result.ariaLabel, `${result.face} Pin keeps an accessible action name`).toBeTruthy();
    expectNear(result.button.width, 44, `${result.face} Pin target width`);
    expectNear(result.button.height, 44, `${result.face} Pin target height`);
    expectNear(result.panel.left, result.updates.left, `${result.face} left edge follows Latest Updates`);
    expectNear(result.panel.right, result.updates.right, `${result.face} right edge follows Latest Updates`);
    expectNear(result.needlePaperGap, 0, `${result.face} needle meets the paper`);
    expect(result.pinHit, `${result.face} Pin owns its center hit`).toBe(true);
    expect(result.linkHit, `${result.face} first link owns its hit`).toBe(true);
    expect(result.errors, `${result.face} has no browser errors`).toEqual([]);

    for (const part of ['button', 'icon', 'needle']) {
      for (const key of geometryKeys) {
        expectNear(result[part][key], baseline[part][key], `${result.face} ${part}.${key} matches ${baseline.face}`);
      }
    }
  }
});
