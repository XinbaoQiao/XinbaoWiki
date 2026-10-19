import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const qaDirectory = path.resolve('.cache/updates-qa');
fs.mkdirSync(qaDirectory, { recursive: true });
let screenshotsAvailable = true;

// Content/layout QA has no live analytics dependency. Match the real v2 path,
// including any configured base path and the production trailing slash.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const activityPath = `${basePath}/api/site-activity/v2/`;
test.beforeEach(async ({ page }) => {
  await page.route(url => url.pathname === activityPath, route => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        cells: [], enabled: false, generatedAt: '2026-10-19T03:00:00Z',
        period: { scope: 'lifetime', since: '2026-08-09' }, schemaVersion: 2,
        thresholds: { cell: 2, total: 2 }, uniqueBrowsersEstimate: null
      })
    });
  });
});

async function captureScreenshot(target, filename) {
  if (!screenshotsAvailable) return;
  try {
    await target.screenshot({ path: path.join(qaDirectory, filename), timeout: 10_000 });
  } catch (error) {
    screenshotsAvailable = false;
    console.warn(`Screenshot path unavailable; DOM and interaction checks continue: ${error.message}`);
  }
}

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
  return errors;
}

async function expectNoPageOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

for (const width of [1440, 390, 320]) {
  test(`Latest Updates: collapse reset, wider view, four-year window and paper order at ${width}px`, async ({ page }) => {
    const errors = captureErrors(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date('2026-10-19T03:00:00Z'));
    await page.goto('/', { waitUntil: 'networkidle' });
    const news = page.locator('#portal-news');
    const newsSummary = page.locator('#portal-news > summary');
    await newsSummary.click();
    await expect(newsSummary).not.toContainText(/past 4 years/i);
    await expect(news).toHaveAttribute('data-updates-view', 'compact');
    const rows = page.locator('.wiki-portal-news-list > li');
    await expect(rows).toHaveCount(8);
    await expect(page.locator('#portal-news time[datetime^="2022-"]')).toHaveCount(0);
    const disclosures = page.locator('#portal-news [data-paper-acceptance]');
    await expect(disclosures).toHaveCount(4);
    await expect(page.locator('#portal-news [data-paper-acceptance][open]')).toHaveCount(1);
    const latestAcceptance = rows.filter({ has: page.locator('time[datetime="2026-09"]') });
    await expect(latestAcceptance.locator('[data-paper-acceptance]')).toHaveAttribute('open', '');
    await latestAcceptance.locator('img').scrollIntoViewIfNeeded();
    await expect.poll(() => latestAcceptance.locator('img').evaluate(element => element.complete && element.naturalWidth === 1400)).toBe(true);
    if (width === 1440) {
      await latestAcceptance.scrollIntoViewIfNeeded();
      await captureScreenshot(page.locator('#portal-news'), 'homepage-latest-acceptance-default.png');
    }
    await latestAcceptance.locator('summary').click();
    await expect(latestAcceptance.locator('[data-paper-acceptance]')).not.toHaveAttribute('open', '');
    await latestAcceptance.locator('summary').click();

    const iclr = rows.filter({ has: page.locator('time[datetime="2025-01"]') });
    const toggle = iclr.locator('[data-paper-acceptance] > summary');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(iclr.locator('[data-paper-acceptance]')).toHaveAttribute('open', '');
    const figures = iclr.locator('figure');
    await expect(figures).toHaveCount(2);
    const geometry = await figures.evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { slug: element.dataset.paperSlug, left: rect.left, top: rect.top, width: rect.width };
    }));
    expect(geometry.map(item => item.slug)).toEqual(['Hessian_Free_Online_Certified_Unlearning', 'DynFrs']);
    expect(geometry[0].left).toBeLessThan(geometry[1].left);
    expect(Math.abs(geometry[0].top - geometry[1].top)).toBeLessThanOrEqual(1);
    for (const image of await iclr.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth === 1400)).toBe(true);
      expect(await image.evaluate(element => Math.abs(element.width / element.height - element.naturalWidth / element.naturalHeight))).toBeLessThan(.01);
    }
    // Transformed ancestors can put a CSS-pixel boundary just below its integer value.
    expect((await toggle.boundingBox()).height).toBeGreaterThanOrEqual((width <= 760 ? 44 : 26) - .1);
    const spacing = await iclr.evaluate(element => {
      const details = element.querySelector('[data-paper-acceptance]');
      const figure = details.querySelector('figure');
      return {
        rowHeight: element.getBoundingClientRect().height,
        summaryHeight: details.querySelector('summary').getBoundingClientRect().height,
        imageToCaption: figure.querySelector('figcaption').getBoundingClientRect().top - figure.querySelector('img').getBoundingClientRect().bottom,
        galleryPadding: getComputedStyle(details.querySelector('[role="region"]')).padding
      };
    });
    fs.writeFileSync(path.join(qaDirectory, `compact-after-${width}.json`), JSON.stringify(spacing, null, 2));
    await expectNoPageOverflow(page);
    await iclr.locator('[role="region"]').evaluate(element => { element.scrollLeft = 0; });
    if (width === 1440) {
      await toggle.evaluate(element => element.blur());
      await iclr.scrollIntoViewIfNeeded();
      await captureScreenshot(page.locator('#portal-news'), 'homepage-paper-previews.png');
    }
    // Closing the entire feed discards manual paper states, including a closed newest preview.
    await latestAcceptance.locator('summary').click();
    await expect(latestAcceptance.locator('[data-paper-acceptance]')).not.toHaveAttribute('open', '');
    await newsSummary.click();
    await expect(news).not.toHaveAttribute('open', '');
    await expect(page.locator('#portal-news [data-paper-acceptance][open]')).toHaveCount(1);
    await expect(latestAcceptance.locator('[data-paper-acceptance]')).toHaveAttribute('open', '');
    await expect(iclr.locator('[data-paper-acceptance]')).not.toHaveAttribute('open', '');
    await newsSummary.click();
    await expect(latestAcceptance.locator('[data-paper-acceptance]')).toHaveAttribute('open', '');

    // The homepage-wide collapse control uses the same reset path.
    await latestAcceptance.locator('summary').click();
    await toggle.click();
    await page.getByRole('button', { name: 'Collapse homepage sections', exact: true }).click();
    await expect(news).not.toHaveAttribute('open', '');
    await expect(page.locator('#portal-news [data-paper-acceptance][open]')).toHaveCount(1);
    await expect(latestAcceptance.locator('[data-paper-acceptance]')).toHaveAttribute('open', '');
    await expect(iclr.locator('[data-paper-acceptance]')).not.toHaveAttribute('open', '');
    await newsSummary.click();

    const compactWidth = (await news.boundingBox()).width;
    const compactImageWidth = (await latestAcceptance.locator('img').boundingBox()).width;
    const viewControls = page.getByRole('group', { name: 'Updates view', exact: true });
    const detailedButton = viewControls.getByRole('button', { name: 'Full', exact: true });
    await detailedButton.focus();
    await page.keyboard.press('Enter');
    await expect(detailedButton).toHaveAttribute('aria-pressed', 'true');
    await expect(news).toHaveAttribute('open', '');
    await expect(news).toHaveAttribute('data-updates-view', 'detailed');
    const detailedWidth = (await news.boundingBox()).width;
    const latestFirstPage = latestAcceptance.locator('[data-paper-image="first-page"] img');
    const detailedImageWidth = (await latestFirstPage.boundingBox()).width;
    if (width === 1440) {
      expect(detailedWidth).toBeGreaterThan(compactWidth * 1.5);
    }
    expect(detailedImageWidth).toBeGreaterThan(compactImageWidth * (width >= 1024 ? 1 : 1.1));
    expect((await detailedButton.boundingBox()).height).toBeGreaterThanOrEqual((width <= 760 ? 44 : 30) - .1);
    const latestHighlight = latestAcceptance.locator('[data-paper-highlight]');
    await expect(latestHighlight).toContainText('random or insufficient evidence');
    await latestHighlight.locator('[data-paper-image="framework"]').scrollIntoViewIfNeeded();
    await latestHighlight.locator('[data-paper-supporting-images]').scrollIntoViewIfNeeded();
    await expect(latestHighlight.locator('img')).toHaveCount(4);
    await expect.poll(() => latestHighlight.locator('img').evaluateAll(elements => elements.every(element => element.complete && element.naturalWidth >= 800))).toBe(true);
    await expect(latestAcceptance.locator('figcaption')).toHaveCount(0);
    const overviewGeometry = await latestAcceptance.locator('[data-paper-slug]').evaluate(element => {
      const rect = target => {
        const box = target.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width };
      };
      return { page: rect(element.querySelector('[data-paper-image="first-page"]')), highlight: rect(element.querySelector('[data-paper-highlight]')) };
    });
    if (width > 760) {
      expect(overviewGeometry.highlight.left).toBeGreaterThan(overviewGeometry.page.right + 12);
      expect(Math.abs(overviewGeometry.highlight.top - overviewGeometry.page.top)).toBeLessThan(1);
      expect(Math.abs(overviewGeometry.highlight.bottom - overviewGeometry.page.bottom)).toBeLessThan(2);
    } else {
      expect(overviewGeometry.highlight.top).toBeGreaterThan(overviewGeometry.page.bottom);
      expect(Math.abs(overviewGeometry.highlight.left - overviewGeometry.page.left)).toBeLessThan(1);
    }
    if (width === 1440 || width === 320) {
      await latestAcceptance.scrollIntoViewIfNeeded();
      await captureScreenshot(news, `homepage-overview-${width}.png`);
    }
    await latestAcceptance.locator('summary').click();
    await toggle.click();
    const activeFigure = iclr.locator('figure:not([hidden])');
    await expect(activeFigure).toHaveCount(1);
    await expect(activeFigure).toHaveAttribute('data-paper-slug', 'Hessian_Free_Online_Certified_Unlearning');
    await expect(activeFigure.locator('[data-paper-highlight]')).toContainText('trajectory statistics');
    const previousPaper = iclr.getByRole('button', { name: 'Previous paper', exact: true });
    const nextPaper = iclr.getByRole('button', { name: 'Next paper', exact: true });
    await expect(previousPaper).toBeDisabled();
    await expect(iclr.locator('output')).toHaveText('1 / 2');
    await nextPaper.focus();
    await page.keyboard.press('Enter');
    await expect(activeFigure).toHaveAttribute('data-paper-slug', 'DynFrs');
    await expect(iclr.locator('output')).toHaveText('2 / 2');
    await expect(nextPaper).toBeDisabled();
    await expect(previousPaper).toBeEnabled();
    await expect(activeFigure.locator('[data-paper-image="first-page"] img')).toHaveAttribute('src', /\/papers\/dynfrs\/camera-ready-first-page\.webp$/);
    await expect(activeFigure.locator('[data-paper-highlight]')).toContainText('lazy tags');
    await expect(activeFigure.locator('[data-paper-image="poster"] img')).toHaveAttribute('src', /\/papers\/dynfrs\/poster-preview\.webp$/);
    await expect(activeFigure.locator('[data-paper-supporting-images] img')).toHaveCount(3);
    await activeFigure.locator('[data-paper-image="poster"]').scrollIntoViewIfNeeded();
    await expect.poll(() => activeFigure.locator('[data-paper-image="poster"] img').evaluate(element => element.complete && element.naturalWidth >= 1000)).toBe(true);
    await previousPaper.click();
    await expect(activeFigure).toHaveAttribute('data-paper-slug', 'Hessian_Free_Online_Certified_Unlearning');
    await nextPaper.click();
    await expectNoPageOverflow(page);
    fs.writeFileSync(path.join(qaDirectory, `updates-views-${width}.json`), JSON.stringify({
      compactWidth, detailedWidth, compactImageWidth, detailedImageWidth, overviewGeometry
    }, null, 2));
    if (width === 1440 || width === 320) {
      await toggle.evaluate(element => element.blur());
      await iclr.scrollIntoViewIfNeeded();
      await captureScreenshot(news, width === 1440 ? 'homepage-detailed-paper-previews.png' : 'homepage-detailed-mobile.png');
    }
    await newsSummary.click();
    await expect(news).not.toHaveAttribute('open', '');
    expect(Math.abs((await news.boundingBox()).width - detailedWidth)).toBeLessThanOrEqual(1);
    await newsSummary.click();
    await expect(news).toHaveAttribute('data-updates-view', 'detailed');
    await expect(page.locator('#portal-news [data-paper-acceptance][open]')).toHaveCount(1);
    await expect(latestAcceptance.locator('[data-paper-acceptance]')).toHaveAttribute('open', '');
    await expect(iclr.locator('[data-paper-acceptance]')).not.toHaveAttribute('open', '');
    await toggle.click();
    await expect(activeFigure).toHaveAttribute('data-paper-slug', 'Hessian_Free_Online_Certified_Unlearning');
    await expect(iclr.locator('output')).toHaveText('1 / 2');
    await expect(previousPaper).toBeDisabled();
    await toggle.click();
    await viewControls.getByRole('button', { name: 'Compact', exact: true }).click();
    expect(Math.abs((await news.boundingBox()).width - compactWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('group', { name: 'Search language', exact: true }).getByRole('button', { name: '中文', exact: true }).click();
    await expect(newsSummary).toContainText('8 条动态');
    await expect(newsSummary).not.toContainText('近四年');
    const chineseViewControls = page.getByRole('group', { name: '动态视图', exact: true });
    await expect(chineseViewControls.getByRole('button', { name: '紧凑', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await chineseViewControls.getByRole('button', { name: '详细', exact: true }).click();
    await expect(news).toHaveAttribute('data-updates-view', 'detailed');
    await expect(rows).toHaveCount(8);
    await expect(iclr.locator('summary')).toContainText('查看论文与简介');
    await expect(page.locator('#portal-news [data-paper-acceptance][open]')).toHaveCount(1);
    await expect(latestAcceptance.locator('[data-paper-acceptance]')).toHaveAttribute('open', '');
    await expect(latestHighlight).toContainText('大语言模型可能');
    await iclr.locator('summary').click();
    await iclr.getByRole('button', { name: '下一篇论文', exact: true }).click();
    await expect(activeFigure).toHaveAttribute('data-paper-slug', 'DynFrs');
    await expect(activeFigure.locator('[data-paper-highlight]')).toContainText('惰性标记');
    await iclr.getByRole('button', { name: '上一篇论文', exact: true }).click();
    await expect(activeFigure).toHaveAttribute('data-paper-slug', 'Hessian_Free_Online_Certified_Unlearning');
    await expectNoPageOverflow(page);
    expect(errors).toEqual([]);
  });
}

for (const slug of ['CV', 'CV_zh']) {
  for (const width of [1440, 320]) {
    test(`${slug}: resource icons and a separate link line at ${width}px`, async ({ page }) => {
      const errors = captureErrors(page);
      await page.setViewportSize({ width, height: 1100 });
      await page.goto(`/wiki/${slug}/`, { waitUntil: 'networkidle' });
      const publications = page.locator('.wiki-body li').filter({ has: page.locator('strong', { hasText: /^Paper #/ }) });
      await expect(publications).toHaveCount(7);
      for (let index = 0; index < 5; index++) {
        const row = publications.nth(index);
        await expect(row.locator('a.publication-resource-link svg')).toHaveCount(3);
        const icons = await row.locator('a.publication-resource-link svg').evaluateAll(elements => elements.map(element => element.dataset.linkIcon));
        expect(icons).toEqual(['openreview', 'arxiv', index === 2 ? 'publisher' : 'code']);
        const linkPrefix = await row.evaluate(element => {
          const firstLink = element.querySelector('a.publication-resource-link');
          let sibling = firstLink.previousSibling;
          const prefix = [];
          while (sibling && sibling.nodeName !== 'BR') {
            prefix.unshift(sibling.textContent);
            sibling = sibling.previousSibling;
          }
          return { hardBreak: sibling?.nodeName === 'BR', text: prefix.join('').trim() };
        });
        expect(linkPrefix).toEqual({ hardBreak: true, text: slug === 'CV_zh' ? '链接：' : 'Links:' });
      }
      if (slug === 'CV_zh') {
        await expect(publications.nth(4)).toContainText('沈卓洋');
        await expect(publications.nth(4)).not.toContainText('Zhuoyang Shen');
      }
      await expectNoPageOverflow(page);
      if (width === 1440 && slug === 'CV_zh') {
        await publications.first().scrollIntoViewIfNeeded();
        await captureScreenshot(publications.first().locator('..'), 'cv-zh-publication-links.png');
      }
      expect(errors).toEqual([]);
    });
  }
}

test('Updates archive retains the older bilingual events and all five previews', async ({ page }) => {
  const errors = captureErrors(page);
  await page.goto('/updates/', { waitUntil: 'networkidle' });
  await expect(page.locator('time[datetime="2022-09"]')).toHaveCount(2);
  await expect(page.locator('time[datetime="2022-07"]')).toHaveCount(2);
  await expect(page.locator('[data-paper-acceptance]')).toHaveCount(8);
  await expect(page.locator('[data-paper-acceptance] img')).toHaveCount(0);
  for (const disclosure of await page.locator('[data-paper-acceptance]').all()) await disclosure.locator('summary').click();
  await expect(page.locator('[data-paper-acceptance] img')).toHaveCount(10);
  expect(errors).toEqual([]);
});

