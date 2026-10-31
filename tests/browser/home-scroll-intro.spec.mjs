import {test, expect} from '@playwright/test';

async function collapseHomepage(page) {
  const collapse = page.getByRole('button', {name: 'Collapse homepage sections', exact: true});
  if (await collapse.isVisible().catch(() => false)) {
    await collapse.click();
  }
  await expect.poll(() =>
    page.evaluate(() =>
      Boolean(document.querySelector('#portal-directory[open], #portal-news[open], #portal-activity[open]'))
    )
  ).toBe(false);
}

test('collapsed name-only homepage enters intro after a short deliberate wheel', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto('/', {waitUntil: 'networkidle'});
  await collapseHomepage(page);
  await expect(page.locator('.wiki-home-scroll-intro')).toHaveAttribute('data-hint-visible', '1');

  const nav = page.waitForURL(/\/wiki\/Your_Name\/?$/, {timeout: 5000});
  for (let i = 0; i < 3; i += 1) {
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(30);
  }
  await nav;
  await expect(page).toHaveURL(/\/wiki\/Your_Name\/?$/);
});

test('collapsed narrow viewport enters intro after a short wheel (touch thresholds)', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/', {waitUntil: 'networkidle'});
  await collapseHomepage(page);
  await expect(page.locator('.wiki-home-scroll-intro')).toHaveAttribute('data-touch-ui', '1');

  const nav = page.waitForURL(/\/wiki\/Your_Name\/?$/, {timeout: 5000});
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(40);
  await page.mouse.wheel(0, 100);
  await nav;
  await expect(page).toHaveURL(/\/wiki\/Your_Name\/?$/);
});

test('expanded Browse mid-page wheel does not jump into intro', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto('/', {waitUntil: 'networkidle'});
  await page.locator('#portal-directory > summary').click();
  await expect(page.locator('#portal-directory')).toHaveAttribute('open', '');
  await page.waitForTimeout(400);

  const mid = await page.evaluate(() => {
    const scrolling = document.scrollingElement || document.documentElement;
    const maxScroll = Math.max(0, scrolling.scrollHeight - scrolling.clientHeight);
    const target = Math.round(Math.max(40, Math.min(maxScroll * 0.25, maxScroll - 120)));
    window.scrollTo(0, target);
    return {
      maxScroll,
      scrollTop: (document.scrollingElement || document.documentElement).scrollTop
    };
  });
  expect(mid.maxScroll).toBeGreaterThan(120);
  expect(mid.scrollTop).toBeLessThan(mid.maxScroll - 80);

  for (let i = 0; i < 3; i += 1) {
    await page.mouse.wheel(0, 80);
    await page.waitForTimeout(40);
  }

  const after = await page.evaluate(() => ({
    path: location.pathname,
    progress: document.querySelector('.wiki-home-scroll-intro')?.getAttribute('data-progress'),
    scrollTop: (document.scrollingElement || document.documentElement).scrollTop,
    maxScroll: Math.max(
      0,
      (document.scrollingElement || document.documentElement).scrollHeight -
        (document.scrollingElement || document.documentElement).clientHeight
    )
  }));
  expect(after.path).toBe('/');
  expect(Number(after.progress || 0)).toBeLessThan(0.08);
  expect(after.scrollTop).toBeLessThan(after.maxScroll - 40);
});