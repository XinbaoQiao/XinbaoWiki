import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const activityPath = `${(process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')}/api/site-activity/v2/`;
test.beforeEach(async ({ page }) => {
  await page.route(url => url.pathname === activityPath, route => route.fulfill({
    status: 200, contentType: 'application/json',
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

async function openDetailed(page, language = 'en') {
  await page.goto('/', { waitUntil: 'networkidle' });
  if (language === 'zh') await page.getByRole('group', { name: 'Search language', exact: true }).getByRole('button', { name: '中文', exact: true }).click();
  await page.locator('#portal-news > summary').click();
  await page.getByRole('group', { name: language === 'zh' ? '动态视图' : 'Updates view', exact: true }).getByRole('button', { name: language === 'zh' ? '详细' : 'Full', exact: true }).click();
}

let screenshotsAvailable = true;
async function capture(page, filename) {
  if (!screenshotsAvailable) return;
  try {
    fs.mkdirSync('.cache/paper-showcase/qa', { recursive: true });
    await page.screenshot({ path: path.resolve('.cache/paper-showcase/qa', filename), timeout: 10_000 });
  } catch (error) {
    screenshotsAvailable = false;
    console.warn(`Screenshot unavailable; computed geometry and interactions remain asserted: ${error.message}`);
  }
}

for (const [width, language] of [[1920, 'en'], [1440, 'en'], [1200, 'en'], [1440, 'zh'], [1200, 'zh']]) {
  test(`Detailed papers: ${language} titles, equal-height media and canonical resource links at ${width}px`, async ({ page }, testInfo) => {
    const errors = captureErrors(page);
    await page.setViewportSize({ width, height: 1100 });
    await openDetailed(page, language);
    const batches = page.locator('#portal-news [data-paper-acceptance]');
    const layouts = [];
    for (const batch of await batches.all()) {
      if (await batch.getAttribute('open') === null) await batch.locator('summary').click();
      await expect.poll(() => batch.evaluate(el => el.getAnimations().length)).toBe(0);
      const count = await batch.locator('figure').count();
      for (let index = 0; index < count; index++) {
        const paper = batch.locator('figure:not([hidden])');
        const slug = await paper.getAttribute('data-paper-slug');
        const source = matter(fs.readFileSync(`wiki/${slug}.md`, 'utf8')).data;
        await expect(paper.locator('figcaption')).toHaveCount(0);
        await expect(paper.locator('[data-paper-title]')).toHaveText(source.title);
        await expect(paper.locator('[data-paper-title]')).toBeVisible();
        await expect(paper.locator('[data-paper-highlight] > p')).toHaveCount(1);
        await expect(paper.locator('[data-paper-supporting-images] button')).toHaveCount(3);
        const primary = paper.locator('[data-paper-image="poster"], [data-paper-image="framework"]');
        await expect(primary).toHaveAttribute('data-paper-image', source.paper_highlight.poster ? 'poster' : 'framework');
        await primary.scrollIntoViewIfNeeded();
        await paper.locator('[data-paper-supporting-images]').scrollIntoViewIfNeeded();
        // Bring each lazy image into the nested viewport before checking decode.
        // Scrolling just the enclosing row can leave it outside the page viewport.
        for (const image of await paper.locator('img').all()) {
          await image.scrollIntoViewIfNeeded();
          await expect(image).toBeInViewport();
          await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth >= 800), { message: `${slug}: ${await image.getAttribute('src')}` }).toBe(true);
        }
        const resources = paper.locator('[data-paper-resources] a');
        expect((await resources.first().getAttribute('href'))?.startsWith('https://')).toBe(true);
        const resourceUrls = await resources.evaluateAll(links => links.map(link => link.href));
        for (const resource of source.links) expect(resourceUrls).toContain(resource.url);
        expect(new Set(resourceUrls).size).toBe(resourceUrls.length);
        await expect(paper.locator('[data-paper-resources] svg')).toHaveCount(resourceUrls.length);
        const layout = await paper.evaluate(root => {
          const rect = target => {
            const box = target.getBoundingClientRect();
            return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, height: box.height, width: box.width };
          };
          const highlight = root.querySelector('[data-paper-highlight]');
          const title = root.querySelector('[data-paper-title]');
          const range = document.createRange();
          range.selectNodeContents(title);
          return {
            slug: root.dataset.paperSlug, page: rect(root.querySelector('[data-paper-image="first-page"]')),
            highlight: rect(highlight), title: rect(title), titleText: rect(range),
            titleLineHeight: parseFloat(getComputedStyle(title).lineHeight),
            tldr: rect(highlight.querySelector('p')), primary: rect(root.querySelector('[data-paper-image="poster"], [data-paper-image="framework"]')),
            primaryRatio: (() => { const image = root.querySelector('[data-paper-image="poster"] img, [data-paper-image="framework"] img'); return image.naturalWidth / image.naturalHeight; })(),
            supporting: rect(root.querySelector('[data-paper-supporting-images]')), resources: rect(root.querySelector('[data-paper-resources]')),
            resourceItems: [...root.querySelector('[data-paper-resources]').children].map(rect),
            squares: [...root.querySelectorAll('[data-paper-supporting-images] button')].map(rect),
            panel: rect(root.closest('#portal-news')),
            contentHeight: highlight.scrollHeight
          };
        });
        expect(layout.highlight.left).toBeGreaterThan(layout.page.right + 12);
        expect(Math.abs(layout.highlight.top - layout.page.top)).toBeLessThan(1);
        expect(Math.abs(layout.highlight.bottom - layout.page.bottom)).toBeLessThan(2);
        expect(layout.titleText.right).toBeLessThanOrEqual(layout.highlight.right + 1);
        expect(layout.titleText.height).toBeLessThanOrEqual(layout.titleLineHeight + 1);
        expect(layout.page.width).toBeCloseTo(360, 0);
        expect(layout.highlight.width).toBeCloseTo(550, 0);
        expect(layout.primary.height).toBeGreaterThanOrEqual(190);
        for (const item of layout.resourceItems) {
          expect(item.right).toBeLessThanOrEqual(layout.resources.right + 1);
          expect(Math.abs((item.top + item.bottom) / 2 - (layout.resources.top + layout.resources.bottom) / 2)).toBeLessThan(1);
        }
        expect(layout.title.bottom).toBeLessThan(layout.tldr.top);
        expect(layout.primary.bottom).toBeLessThan(layout.supporting.top);
        expect(Math.abs(layout.primary.left - layout.supporting.left)).toBeLessThan(1);
        expect(Math.abs(layout.primary.right - layout.supporting.right)).toBeLessThan(1);
        expect(Math.abs(layout.primary.left - layout.highlight.left)).toBeLessThan(1);
        expect(Math.abs(layout.primary.right - layout.highlight.right)).toBeLessThan(1);
        expect(layout.supporting.height).toBeCloseTo(80, 0);
        expect(layout.supporting.bottom).toBeLessThan(layout.resources.top);
        expect(layout.contentHeight).toBeLessThanOrEqual(layout.highlight.height + 1);
        expect(layout.panel.width).toBeLessThanOrEqual(1084);
        for (const square of layout.squares) {
          expect(square.height).toBeCloseTo(80, 0);
        }
        layouts.push(layout);
        if (width === 1440 && slug.includes('Sample_Selection')) await capture(page, 'model-collapse-detailed.png');
        if (index + 1 < count) await batch.getByRole('button', { name: language === 'zh' ? '下一篇论文' : 'Next paper', exact: true }).click();
      }
    }
    expect(layouts).toHaveLength(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    fs.mkdirSync('.cache/right-column', { recursive: true });
    fs.writeFileSync(`.cache/right-column/layouts-${language}-${width}.json`, JSON.stringify(layouts, null, 2));
    await testInfo.attach('paper-layouts', { body: Buffer.from(JSON.stringify(layouts, null, 2)), contentType: 'application/json' });
  });
}

test.describe('In-page image enlargement', () => {
  test.use({ reducedMotion: 'no-preference' });
  for (const width of [1440, 320]) {
    test(`animated image dialog, backdrop, focus restoration and close paths at ${width}px`, async ({ page }) => {
      const errors = captureErrors(page);
      await page.setViewportSize({ width, height: 1000 });
      await openDetailed(page);
      const paper = page.locator('#portal-news figure').first();
      const firstPage = paper.locator('[data-paper-image="first-page"]');
      const dialog = page.locator('[data-paper-image-dialog]');
      const url = page.url();
      const popups = [];
      page.on('popup', popup => popups.push(popup));
      await firstPage.click();
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveJSProperty('open', true);
      expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
      await expect(dialog.locator('img')).toHaveAttribute('src', /camera-ready-first-page\.webp$/);
      await expect.poll(() => dialog.evaluate(element => getComputedStyle(element).opacity)).toBe('1');
      const overlay = await dialog.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const backdrop = getComputedStyle(element, '::backdrop');
        return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, filter: backdrop.backdropFilter, background: backdrop.backgroundColor, animation: getComputedStyle(element).animationName, overflow: document.body.style.overflow };
      });
      expect(overlay.left).toBeGreaterThanOrEqual(0);
      expect(overlay.right).toBeLessThanOrEqual(width);
      expect(overlay.bottom).toBeLessThanOrEqual(1000);
      expect(overlay.filter).toBe('blur(8px)');
      expect(overlay.background).toMatch(/0\.32/);
      expect(overlay.animation).not.toBe('none');
      expect(overlay.overflow).toBe('hidden');
      await capture(page, `image-lightbox-${width}.png`);
      await dialog.locator('img').click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(firstPage).toBeFocused();
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
      const framework = paper.locator('[data-paper-image="framework"]');
      await framework.click();
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Close image', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await paper.locator('[data-paper-image="supporting"]').first().click();
      await expect(dialog).toBeVisible();
      await page.mouse.click(2, 2);
      await expect(dialog).toHaveCount(0);
      expect(page.url()).toBe(url);
      expect(popups).toHaveLength(0);
      expect(errors).toEqual([]);
    });
  }
});

test('image dialog respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = captureErrors(page);
  await openDetailed(page);
  await page.locator('#portal-news [data-paper-image="first-page"]').first().click();
  const dialog = page.locator('[data-paper-image-dialog]');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  expect(await dialog.evaluate(element => getComputedStyle(element, '::backdrop').animationName)).toBe('none');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('closed and inactive paper previews release image nodes across repeated use', async ({ page }) => {
  const errors = captureErrors(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  const news = page.locator('#portal-news');
  await expect(news.locator('img')).toHaveCount(0);
  await news.locator(':scope > summary').click();
  await page.getByRole('button', { name: 'Full', exact: true }).click();
  await expect(news.locator('img')).toHaveCount(5);
  const pair = news.locator('[data-paper-acceptance]').filter({ has: page.locator('figure[data-paper-slug="DynFrs"]') });
  await pair.locator('summary').click();
  for (let i = 0; i < 6; i++) {
    await pair.getByRole('button', { name: 'Next paper', exact: true }).click();
    await expect(pair.locator('figure[hidden] img')).toHaveCount(0);
    await expect(pair.locator('img')).toHaveCount(5);
    await pair.getByRole('button', { name: 'Previous paper', exact: true }).click();
    await expect(pair.locator('figure[hidden] img')).toHaveCount(0);
  }
  await pair.locator('summary').click();
  await expect(pair.locator('img')).toHaveCount(0);
  await news.locator(':scope > summary').click();
  await expect(news.locator('img')).toHaveCount(0);
  await news.locator(':scope > summary').click();
  await expect(news).toHaveAttribute('data-updates-view', 'compact');
  await page.getByRole('button', { name: 'Full', exact: true }).click();
  await expect(news.locator('img')).toHaveCount(5);
  expect(errors).toEqual([]);
});

