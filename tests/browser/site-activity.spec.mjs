import { expect, test } from '@playwright/test';

const aggregate = {
  cells: [
    { level: 1, x: 175, y: 105 },
    { level: 2, x: 356, y: 102 },
    { level: 3, x: 520, y: 126 }
  ],
  enabled: true,
  generatedAt: '2026-08-09T00:00:00.000Z',
  period: { scope: 'lifetime', since: '2026-08-09' },
  schemaVersion: 2,
  thresholds: { cell: 2, total: 2 },
  uniqueBrowsersEstimate: 7
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

async function readLegendMetrics(legend) {
  return legend.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    centers: [...element.children].map((child) => {
      const bounds = child.getBoundingClientRect();
      return bounds.top + bounds.height / 2;
    })
  }));
}

function expectSingleLineLegend(metrics) {
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(Math.max(...metrics.centers) - Math.min(...metrics.centers)).toBeLessThanOrEqual(1);
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
  await expect(activity.locator('summary')).toContainText('7 browsers · all history');

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
  await expect(map).toHaveAccessibleName('Visitor activity world map');
  await expect(activity.locator('.wiki-visitor-atlas-cluster')).toHaveCount(3);
  await expect(activity.locator('.wiki-visitor-atlas-legend')).toContainText('Not public');
  await expect(activity.locator('.wiki-visitor-atlas-legend')).toContainText('High');
  expectSingleLineLegend(await readLegendMetrics(activity.locator('.wiki-visitor-atlas-legend')));
  await expect(activity.locator('figcaption > *')).toHaveCount(1);
  await expect(activity.locator('.wiki-visitor-atlas-note')).toHaveCount(0);
  await expect(activity).not.toContainText('Cells appear only after');
  await expect(activity).not.toContainText('Approximate IP');
  await expect(activity).not.toContainText('No map cell');
  await expect(activity).not.toContainText('Country / region ranking');
  await expect(activity).not.toContainText('latitude');
  await expect(activity).not.toContainText('longitude');

  await page.locator('.wiki-search-language-select').selectOption('zh');
  await expect(map).toHaveAccessibleName('访问足迹世界地图');
  await expect(activity.locator('summary')).toContainText('约 7 个浏览器 · 全部历史');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

  await page.setViewportSize({ width: 320, height: 720 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const mapBounds = await map.boundingBox();
  expect(mapBounds).not.toBeNull();
  expect(mapBounds.x).toBeGreaterThanOrEqual(0);
  expect(mapBounds.x + mapBounds.width).toBeLessThanOrEqual(320.5);
  expect(mapBounds.width / mapBounds.height).toBeCloseTo(672 / 276, 1);
  const legend = activity.locator('.wiki-visitor-atlas-legend');
  expectSingleLineLegend(await readLegendMetrics(legend));

  await page.locator('.wiki-search-language-select').selectOption('en');
  expectSingleLineLegend(await readLegendMetrics(legend));
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
  await expect(atlas.getByRole('status')).toContainText('Loading activity map');
  releaseResponse();
  await expect(atlas).toHaveAttribute('aria-busy', 'false');
  await expect(atlas.getByRole('status')).toContainText('Statistics are unavailable');
  await expect(atlas.locator('.wiki-visitor-atlas-cluster')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('visitor atlas retries migration, then distinguishes a persistent error from a quiet empty aggregate', async ({ page }) => {
  const errors = captureErrors(page, {
    allowSiteActivityAbort: true,
    allowSiteActivityHttpError: true
  });
  let responseMode = 'migration';
  let migrationReads = 0;
  await installRoutes(page, () => {
    if (responseMode === 'migration' && migrationReads++ === 0) return { body: '', status: 503 };
    if (responseMode === 'migration') {
      return { body: JSON.stringify(aggregate), contentType: 'application/json', status: 200 };
    }
    if (responseMode === 'error') return { body: '', status: 503 };
    return {
        body: JSON.stringify({ ...aggregate, cells: [], uniqueBrowsersEstimate: null }),
        contentType: 'application/json',
        status: 200
      };
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  const atlas = page.locator('#portal-activity .wiki-visitor-atlas');
  const status = page.locator('#portal-activity .wiki-visitor-atlas-status');
  await expect(atlas).toHaveAttribute('data-status', 'ready');
  await expect(page.locator('#portal-activity .wiki-visitor-atlas-cluster')).toHaveCount(3);

  responseMode = 'error';
  await page.reload({ waitUntil: 'networkidle' });
  await expect(status).toContainText('temporarily unavailable');

  responseMode = 'empty';
  await page.reload({ waitUntil: 'networkidle' });
  await expect(atlas).toHaveAttribute('data-status', 'empty');
  await expect(atlas.locator('.wiki-visitor-atlas-status')).toHaveCount(0);
  await expect(page.locator('#portal-activity')).not.toContainText('No map cell');
  await expect(page.locator('#portal-activity .wiki-visitor-atlas-cluster')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('site activity preference persists a real cross-location browser exclusion and can rejoin', async ({ context, page }) => {
  const errors = captureErrors(page, { allowSiteActivityAbort: true });
  await page.route('https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap', (route) => route.fulfill({
    body: '',
    contentType: 'text/css',
    status: 200
  }));
  const activityPosts = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/site-activity/' && request.method() === 'POST') {
      activityPosts.push(request.headers());
    }
  });

  await page.goto('/site-activity-preferences/', { waitUntil: 'networkidle' });
  await context.addCookies([{
    httpOnly: true,
    name: 'xinbao_site_vid',
    sameSite: 'Lax',
    url: new URL(page.url()).origin,
    value: 'test-preserved-visitor-cookie'
  }]);
  const panel = page.getByRole('region', { name: 'This browser / 此浏览器' });
  await expect(panel.getByText('Included / 已计入')).toBeVisible();
  await expect(panel).toContainText('across countries and regions');
  await expect(panel).toContainText('已有全历史聚合无法单独删除');

  await panel.getByRole('button', { name: 'Exclude this browser / 排除此浏览器' }).click({ force: true });
  await expect(panel.getByText('Excluded / 已排除')).toBeVisible();
  const exclusionCookie = (await context.cookies(page.url())).find((cookie) => cookie.name === 'xinbao_site_activity_excluded');
  expect(exclusionCookie).toMatchObject({
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
    secure: true
  });

  await page.reload({ waitUntil: 'networkidle' });
  await expect(panel.getByText('Excluded / 已排除')).toBeVisible();
  const activityStatuses = await page.evaluate(async () => {
    const responses = await Promise.all([
      fetch('/api/site-activity/', {
        headers: { 'x-vercel-ip-latitude': '22.3', 'x-vercel-ip-longitude': '114.2' },
        method: 'POST'
      }),
      fetch('/api/site-activity/', {
        headers: { 'x-vercel-ip-latitude': '40.7', 'x-vercel-ip-longitude': '-74.0' },
        method: 'POST'
      })
    ]);
    return responses.map((response) => response.status);
  });
  expect(activityStatuses).toEqual([204, 204]);
  expect(activityPosts).toHaveLength(2);
  for (const headers of activityPosts) {
    expect(headers.cookie).toContain('xinbao_site_activity_excluded=');
  }

  await panel.getByRole('button', { name: 'Include this browser / 重新计入此浏览器' }).click({ force: true });
  await expect(panel.getByText('Included / 已计入')).toBeVisible();
  let cookies = await context.cookies(page.url());
  expect(cookies.some((cookie) => cookie.name === 'xinbao_site_activity_excluded')).toBe(false);
  expect(cookies.find((cookie) => cookie.name === 'xinbao_site_vid')?.value).toBe('test-preserved-visitor-cookie');

  const repeatedDeleteStatus = await page.evaluate(async () => (
    await fetch('/api/site-activity/preference/', { method: 'DELETE' })
  ).status);
  expect(repeatedDeleteStatus).toBe(204);
  cookies = await context.cookies(page.url());
  expect(cookies.find((cookie) => cookie.name === 'xinbao_site_vid')?.value).toBe('test-preserved-visitor-cookie');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
