import { expect, test } from '@playwright/test';

const aggregate = {
  cells: [
    { level: 1, x: 175, y: 105 },
    { level: 2, x: 356, y: 102 },
    { level: 3, x: 520, y: 126 }
  ],
  enabled: true,
  generatedAt: '2026-08-09T00:00:00.000Z',
  schemaVersion: 1,
  thresholds: { cell: 5, total: 10 },
  timezone: 'UTC',
  uniqueBrowsersEstimate: 25,
  window: { completeDays: 30, end: '2026-08-08', start: '2026-07-10' }
};

const unavailableAggregate = {
  ...aggregate,
  cells: [],
  enabled: false,
  uniqueBrowsersEstimate: null
};

async function installRoutes(page, getResponse) {
  await page.route('https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap', (route) => route.fulfill({
    body: '',
    contentType: 'text/css',
    status: 200
  }));
  await page.route('**/api/site-activity/**', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ body: '', status: 204 });
    }
    const response = await getResponse();
    return route.fulfill(response);
  });
}

function captureErrors(page, {
  allowSiteActivityAbort = false,
  allowSiteActivityHttpError = false
} = {}) {
  const errors = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !(allowSiteActivityHttpError && /(?:site-activity|503)/i.test(message.text()))
    ) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText || 'failed';
    if (
      allowSiteActivityAbort &&
      request.url().includes('/api/site-activity/') &&
      errorText === 'net::ERR_ABORTED'
    ) return;
    errors.push(`request: ${request.url()} (${errorText})`);
  });
  return errors;
}

test('homepage visitor atlas is scoped, accessible, bilingual, and responsive', async ({ page }) => {
  const errors = captureErrors(page, { allowSiteActivityAbort: true });
  await installRoutes(page, () => ({ body: JSON.stringify(aggregate), contentType: 'application/json', status: 200 }));

  await page.goto('/', { waitUntil: 'networkidle' });

  const activity = page.locator('#portal-activity');
  const homepageToggle = page.locator('.wiki-portal-name-button');
  await expect(activity).not.toHaveAttribute('open', '');
  await expect(homepageToggle).toHaveAttribute('aria-controls', 'portal-news portal-activity portal-directory');
  await expect(homepageToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(activity.locator('summary')).toContainText('25 browsers');

  await homepageToggle.click({ force: true });
  await expect(page.locator('#portal-news')).toHaveAttribute('open', '');
  await expect(activity).toHaveAttribute('open', '');
  await expect(page.locator('#portal-directory')).toHaveAttribute('open', '');
  await expect(homepageToggle).toHaveAttribute('aria-expanded', 'true');
  await homepageToggle.click({ force: true });
  await expect(activity).not.toHaveAttribute('open', '');
  await expect(homepageToggle).toHaveAttribute('aria-expanded', 'false');

  await homepageToggle.click({ force: true });
  const map = activity.locator('svg[role="img"]');
  await expect(activity).toHaveAttribute('open', '');
  await expect(map).toBeVisible();
  await expect(map).toHaveAccessibleName('Anonymous visitor activity world map');
  await expect(activity.locator('.wiki-visitor-atlas-cluster')).toHaveCount(3);
  await expect(activity.locator('.wiki-visitor-atlas-legend')).toContainText('Not public');
  await expect(activity.locator('.wiki-visitor-atlas-legend')).toContainText('High');
  await expect(activity).not.toContainText('Country / region ranking');
  await expect(activity).not.toContainText('latitude');
  await expect(activity).not.toContainText('longitude');

  await page.locator('.wiki-search-language-select').selectOption('zh');
  await expect(map).toHaveAccessibleName('匿名访问足迹世界地图');
  await expect(activity.locator('summary')).toContainText('近 30 个完整日约 25 个浏览器');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const mapBounds = await map.boundingBox();
  expect(mapBounds).not.toBeNull();
  expect(mapBounds.x).toBeGreaterThanOrEqual(0);
  expect(mapBounds.x + mapBounds.width).toBeLessThanOrEqual(390.5);
  expect(mapBounds.width / mapBounds.height).toBeCloseTo(672 / 276, 1);
  await expect.poll(() => activity.locator('figcaption').evaluate((element) => (
    getComputedStyle(element).flexDirection
  ))).toBe('column');
  expect(errors).toEqual([]);
});

test('visitor atlas exposes loading and disabled states without sample markers', async ({ page }) => {
  const errors = captureErrors(page, { allowSiteActivityAbort: true });
  let releaseResponse;
  let markRequestStarted;
  const responseGate = new Promise((resolve) => {
    releaseResponse = resolve;
  });
  const requestStarted = new Promise((resolve) => {
    markRequestStarted = resolve;
  });
  await installRoutes(page, async () => {
    markRequestStarted();
    await responseGate;
    return { body: JSON.stringify(unavailableAggregate), contentType: 'application/json', status: 200 };
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await requestStarted;
  await page.locator('.wiki-portal-name-button').click({ force: true });
  const atlas = page.locator('#portal-activity .wiki-visitor-atlas');
  await expect(page.locator('#portal-activity')).toHaveAttribute('open', '');
  await expect(atlas).toBeVisible();
  await expect(atlas).toHaveAttribute('aria-busy', 'true');
  await expect(atlas.getByRole('status')).toContainText('Loading the anonymous visitor map');
  releaseResponse();
  await expect(atlas).toHaveAttribute('aria-busy', 'false');
  await expect(atlas.getByRole('status')).toContainText('Statistics are not configured yet');
  await expect(atlas.locator('.wiki-visitor-atlas-cluster')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('visitor atlas distinguishes a temporary error from a below-threshold aggregate', async ({ page }) => {
  const errors = captureErrors(page, {
    allowSiteActivityAbort: true,
    allowSiteActivityHttpError: true
  });
  let responseMode = 'error';
  await installRoutes(page, () => responseMode === 'error'
    ? { body: '', status: 503 }
    : {
        body: JSON.stringify({ ...aggregate, cells: [], uniqueBrowsersEstimate: null }),
        contentType: 'application/json',
        status: 200
      });

  await page.goto('/', { waitUntil: 'networkidle' });
  const status = page.locator('#portal-activity .wiki-visitor-atlas-status');
  await expect(status).toContainText('temporarily unavailable');

  responseMode = 'empty';
  await page.reload({ waitUntil: 'networkidle' });
  await expect(status).toContainText('No map cell has reached the public display threshold yet');
  await expect(page.locator('#portal-activity .wiki-visitor-atlas-cluster')).toHaveCount(0);
  expect(errors).toEqual([]);
});
