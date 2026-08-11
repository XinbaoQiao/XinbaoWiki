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

const ownerTestPassword = 'playwright-owner-password';
const activityPath = '/api/site-activity/v2/';
const ownerPreferencePath = '/api/site-activity/preference/';

async function installRoutes(page, getResponse, {
  mockActivityPost = true,
  preferencePostResponse = null
} = {}) {
  await page.route('https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap', (route) => route.fulfill({
    body: '',
    contentType: 'text/css',
    status: 200
  }));
  const interceptSiteActivity = async (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/\/+$/, '');
    if (pathname === activityPath.replace(/\/$/, '')) {
      if (route.request().method() === 'POST' && mockActivityPost) {
        return route.fulfill({ body: '', status: 204 });
      }
      if (route.request().method() === 'GET') {
        const response = await getResponse();
        if (response.abort) return route.abort(response.abort);
        return route.fulfill(response);
      }
      return route.fallback();
    }
    if (pathname.endsWith(ownerPreferencePath.replace(/\/$/, '')) && route.request().method() === 'POST' && preferencePostResponse) {
      return route.fulfill(preferencePostResponse);
    }
    return route.fallback();
  };
  await page.route('**/api/site-activity', interceptSiteActivity);
  await page.route('**/api/site-activity/**', interceptSiteActivity);
}

function captureErrors(page, {
  allowSiteActivityAbort = false,
  allowSiteActivityHttpError = false,
  allowSiteActivityRetryFailure = false
} = {}) {
  const errors = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !(allowSiteActivityHttpError && /(?:site-activity|401|429|503)/i.test(message.text())) &&
      !(allowSiteActivityRetryFailure && message.text() === 'Failed to load resource: net::ERR_FAILED')
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
    if (
      allowSiteActivityRetryFailure &&
      request.url().includes(activityPath) &&
      errorText === 'net::ERR_FAILED'
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
    }),
    scaleRanges: [...element.querySelectorAll('.wiki-visitor-atlas-legend-scale > span')].map((child) => {
      const bounds = child.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(child);
      const textBounds = range.getBoundingClientRect();
      return {
        cellLeft: bounds.left,
        cellRight: bounds.right,
        textLeft: textBounds.left,
        textRight: textBounds.right
      };
    })
  }));
}

function expectSingleLineLegend(metrics) {
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(Math.max(...metrics.centers) - Math.min(...metrics.centers)).toBeLessThanOrEqual(1);
  for (const range of metrics.scaleRanges) {
    expect(range.textLeft).toBeGreaterThanOrEqual(range.cellLeft - 0.5);
    expect(range.textRight).toBeLessThanOrEqual(range.cellRight + 0.5);
  }
  for (let index = 1; index < metrics.scaleRanges.length; index += 1) {
    expect(metrics.scaleRanges[index - 1].textRight).toBeLessThanOrEqual(metrics.scaleRanges[index].textLeft + 0.5);
  }
}

async function waitForOwnerDialogReady(page) {
  const preferenceResponse = page.waitForResponse((response) => (
    new URL(response.url()).pathname === ownerPreferencePath &&
    response.request().method() === 'GET'
  ));
  const trigger = page.getByRole('button', { name: 'Public intensity' });
  await expect(trigger).toBeVisible();
  // Native details-content transitions confuse Playwright actionability; the
  // separate keyboard test and pointer smoke cover physical activation.
  await trigger.evaluate((element) => element.click());
  await preferenceResponse;
  const dialog = page.getByRole('dialog', { name: 'Activity controls' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Exclude this browser' })).toBeEnabled();
  return { dialog, trigger };
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
  const ownerTrigger = activity.locator('.wiki-visitor-atlas-legend-trigger');
  await expect(ownerTrigger).toBeVisible();
  await expect(ownerTrigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(ownerTrigger).toHaveAttribute('aria-controls', 'visitor-atlas-owner-dialog');
  await expect(ownerTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(activity.locator('#visitor-atlas-owner-dialog')).toBeHidden();
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
  const legendBounds = await legend.boundingBox();
  const triggerBounds = await ownerTrigger.boundingBox();
  expect(legendBounds).not.toBeNull();
  expect(triggerBounds).not.toBeNull();
  expect(triggerBounds.x).toBeGreaterThanOrEqual(legendBounds.x - 0.5);
  expect(triggerBounds.x + triggerBounds.width).toBeLessThanOrEqual(legendBounds.x + legendBounds.width + 0.5);

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
    if (responseMode === 'ready') {
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
  await page.locator('.wiki-portal-name-button').click({ force: true });
  await expect(page.locator('#portal-activity')).toHaveAttribute('open', '');
  await expect(status).toContainText('temporarily unavailable');
  const retry = page.getByRole('button', { name: 'Retry' });
  await expect(retry).toBeVisible();

  responseMode = 'ready';
  await retry.evaluate((element) => element.click());
  await expect(atlas).toHaveAttribute('data-status', 'ready');
  await expect(retry).toHaveCount(0);

  responseMode = 'empty';
  await page.reload({ waitUntil: 'networkidle' });
  await expect(atlas).toHaveAttribute('data-status', 'empty');
  await expect(atlas.locator('.wiki-visitor-atlas-status')).toHaveCount(0);
  await expect(page.locator('#portal-activity')).not.toContainText('No map cell');
  await expect(page.locator('#portal-activity .wiki-visitor-atlas-cluster')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('visitor atlas retries a transport failure before exposing an error', async ({ page }) => {
  const errors = captureErrors(page, {
    allowSiteActivityAbort: true,
    allowSiteActivityRetryFailure: true
  });
  let reads = 0;
  await installRoutes(page, () => {
    reads += 1;
    if (reads === 1) return { abort: 'failed' };
    return { body: JSON.stringify(aggregate), contentType: 'application/json', status: 200 };
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#portal-activity .wiki-visitor-atlas')).toHaveAttribute('data-status', 'ready');
  expect(reads).toBe(2);
  expect(errors).toEqual([]);
});

test('hidden owner dialog is keyboard accessible and remains inside a 320px viewport', async ({ page }) => {
  test.skip(Boolean(process.env.CUBE_GEOMETRY_BASE_URL), 'owner password fixture is local-only');
  const errors = captureErrors(page, { allowSiteActivityAbort: true });
  await installRoutes(page, () => ({ body: JSON.stringify(aggregate), contentType: 'application/json', status: 200 }));
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('.wiki-portal-name-button').click({ force: true });

  const trigger = page.getByRole('button', { name: 'Public intensity' });
  const preferenceResponse = page.waitForResponse((response) => (
    new URL(response.url()).pathname === ownerPreferencePath &&
    response.request().method() === 'GET'
  ));
  const dialog = page.getByRole('dialog', { name: 'Activity controls' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await preferenceResponse;
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Exclude this browser' })).toBeEnabled();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#visitor-atlas-owner-password')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await page.keyboard.press('Space');
  await expect(dialog).toBeVisible();
  await page.setViewportSize({ width: 320, height: 720 });
  const dialogBounds = await dialog.boundingBox();
  expect(dialogBounds).not.toBeNull();
  expect(dialogBounds.x).toBeGreaterThanOrEqual(0);
  expect(dialogBounds.y).toBeGreaterThanOrEqual(0);
  expect(dialogBounds.x + dialogBounds.width).toBeLessThanOrEqual(320.5);
  expect(dialogBounds.y + dialogBounds.height).toBeLessThanOrEqual(720.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('wrong owner password leaves the browser included and exposes only a generic error', async ({ context, page }) => {
  test.skip(Boolean(process.env.CUBE_GEOMETRY_BASE_URL), 'owner password fixture is local-only');
  const errors = captureErrors(page, {
    allowSiteActivityAbort: true,
    allowSiteActivityHttpError: true
  });
  await installRoutes(page, () => ({ body: JSON.stringify(aggregate), contentType: 'application/json', status: 200 }));
  const ownerRequests = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === ownerPreferencePath && request.method() === 'POST') ownerRequests.push(request);
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('.wiki-portal-name-button').click({ force: true });
  const { dialog } = await waitForOwnerDialogReady(page);
  await page.locator('#visitor-atlas-owner-password').fill('wrong-owner-password');
  await dialog.getByRole('button', { name: 'Exclude this browser' }).click({ force: true });
  await expect(dialog.getByRole('alert')).toHaveText('Password not accepted.');
  expect((await context.cookies(page.url())).some((cookie) => cookie.name === 'xinbao_site_activity_excluded')).toBe(false);
  expect(ownerRequests).toHaveLength(1);
  expect(new URL(ownerRequests[0].url()).search).toBe('');
  expect(ownerRequests[0].postData()).toContain('wrong-owner-password');
  expect(errors).toEqual([]);
});

test('correct owner password sets an exclusion cookie across simulated locations and rejoining preserves the visitor cookie', async ({ context, page, request }) => {
  test.skip(Boolean(process.env.CUBE_GEOMETRY_BASE_URL), 'owner password fixture is local-only');
  const errors = captureErrors(page, { allowSiteActivityAbort: true });
  const activityPosts = [];
  page.on('request', (requestEvent) => {
    const url = new URL(requestEvent.url());
    if (url.pathname === activityPath && requestEvent.method() === 'POST') activityPosts.push(requestEvent.headers());
  });
  await installRoutes(page, () => ({ body: JSON.stringify(aggregate), contentType: 'application/json', status: 200 }));
  await page.goto('/', { waitUntil: 'networkidle' });
  await context.addCookies([{
    httpOnly: true,
    name: 'xinbao_site_vid',
    sameSite: 'Lax',
    url: new URL(page.url()).origin,
    value: 'test-preserved-visitor-cookie'
  }]);
  await page.locator('.wiki-portal-name-button').click({ force: true });
  const { dialog } = await waitForOwnerDialogReady(page);
  await page.locator('#visitor-atlas-owner-password').fill(ownerTestPassword);
  await dialog.getByRole('button', { name: 'Exclude this browser' }).click({ force: true });
  await expect(dialog.getByRole('status')).toHaveText('This browser is now excluded from future activity.');
  const exclusionCookie = (await context.cookies(page.url())).find((cookie) => cookie.name === 'xinbao_site_activity_excluded');
  expect(exclusionCookie).toMatchObject({
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
    secure: true
  });

  const cookieHeader = `${exclusionCookie.name}=${exclusionCookie.value}`;
  const activityStatuses = await Promise.all([
    request.post(activityPath, {
      headers: {
        cookie: cookieHeader,
        'x-vercel-forwarded-for': '198.51.100.10',
        'x-vercel-ip-latitude': '22.3',
        'x-vercel-ip-longitude': '114.2'
      }
    }),
    request.post(activityPath, {
      headers: {
        cookie: cookieHeader,
        'x-vercel-forwarded-for': '198.51.100.11',
        'x-vercel-ip-latitude': '40.7',
        'x-vercel-ip-longitude': '-74.0'
      }
    })
  ]);
  expect(activityStatuses.map((response) => response.status())).toEqual([204, 204]);
  await expect(dialog.getByRole('button', { name: 'Include this browser' })).toBeVisible();
  await page.locator('#visitor-atlas-owner-password').fill(ownerTestPassword);
  await dialog.getByRole('button', { name: 'Include this browser' }).click({ force: true });
  await expect(dialog.getByRole('status')).toHaveText('This browser will be included in future activity.');
  const cookies = await context.cookies(page.url());
  expect(cookies.some((cookie) => cookie.name === 'xinbao_site_activity_excluded')).toBe(false);
  expect(cookies.find((cookie) => cookie.name === 'xinbao_site_vid')?.value).toBe('test-preserved-visitor-cookie');
  expect(activityPosts.every((headers) => !headers.cookie || headers.cookie.includes('xinbao_site_activity_excluded=') || headers.cookie.includes('xinbao_site_vid='))).toBe(true);
  expect(errors).toEqual([]);
});

test('owner dialog surfaces rate-limit and unavailable responses without changing cookies', async ({ context, page }) => {
  test.skip(Boolean(process.env.CUBE_GEOMETRY_BASE_URL), 'owner password fixture is local-only');
  for (const scenario of [
    { name: 'rate-limit', response: { body: '', headers: { 'Retry-After': '900' }, status: 429 }, message: 'Too many attempts. Try again later.' },
    { name: 'unavailable', response: { body: '', status: 503 }, message: 'Private controls are temporarily unavailable.' }
  ]) {
    await context.clearCookies();
    await installRoutes(page, () => ({ body: JSON.stringify(aggregate), contentType: 'application/json', status: 200 }), { preferencePostResponse: scenario.response });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.wiki-portal-name-button').click({ force: true });
    const { dialog } = await waitForOwnerDialogReady(page);
    await page.locator('#visitor-atlas-owner-password').fill(ownerTestPassword);
    await dialog.getByRole('button', { name: 'Exclude this browser' }).click({ force: true });
    await expect(dialog.getByRole('alert')).toHaveText(scenario.message);
    expect((await context.cookies(page.url())).some((cookie) => cookie.name === 'xinbao_site_activity_excluded')).toBe(false);
  }
});

test('owner endpoint rejects malformed JSON and cross-origin writes before authentication', async ({ request }) => {
  test.skip(Boolean(process.env.CUBE_GEOMETRY_BASE_URL), 'owner password fixture is local-only');
  const malformed = await request.post(ownerPreferencePath, {
    data: JSON.stringify({ password: ownerTestPassword }),
    headers: { 'content-type': 'application/json' }
  });
  expect(malformed.status()).toBe(400);
  expect(malformed.headers()['cache-control']).toContain('private');
  expect(malformed.headers()['set-cookie'] || '').not.toContain('xinbao_site_activity_excluded=');

  const crossOrigin = await request.post(ownerPreferencePath, {
    data: JSON.stringify({ excluded: true, password: ownerTestPassword }),
    headers: {
      'content-type': 'application/json',
      origin: 'https://attacker.invalid'
    }
  });
  expect(crossOrigin.status()).toBe(403);
  expect(crossOrigin.headers()['set-cookie'] || '').not.toContain('xinbao_site_activity_excluded=');
});
