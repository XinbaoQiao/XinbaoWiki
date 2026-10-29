import { test, expect } from '@playwright/test';

async function aligned(page) {
  await expect.poll(() => page.locator('.wiki-sidebar-desktop').evaluate(root => {
    const marker = root.querySelector('.wiki-sidebar-current-marker').getBoundingClientRect();
    const link = root.querySelector('a[aria-current="page"]').getBoundingClientRect();
    return Math.max(Math.abs(marker.top - link.top), Math.abs(marker.height - link.height));
  })).toBeLessThan(1);
}

test('sidebar marker moves through intermediate positions and aligns after back navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/wiki/Xinbao_Qiao/', { waitUntil: 'networkidle' });
  await aligned(page);
  const frames = await page.locator('.wiki-sidebar-desktop').evaluate(async root => {
    const marker = root.querySelector('.wiki-sidebar-current-marker');
    const before = marker.getBoundingClientRect().top;
    const link = root.querySelector('a[href*="Data_Centric_Machine_Learning"]');
    const target = link.getBoundingClientRect().top;
    const values = [];
    link.click();
    const start = performance.now();
    while (performance.now() - start < 500) {
      await new Promise(requestAnimationFrame);
      values.push(marker.getBoundingClientRect().top);
    }
    return { before, target, values };
  });
  expect(frames.values.filter(y => y > Math.min(frames.before, frames.target) + 2 && y < Math.max(frames.before, frames.target) - 2).length).toBeGreaterThan(2);
  await expect(page).toHaveURL(/Data_Centric_Machine_Learning/);
  await aligned(page);
  await page.goBack();
  await aligned(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.wiki-sidebar-desktop a[href*="AI_and_Networks"]').click();
  await aligned(page);
  expect(await page.locator('.wiki-sidebar-current-marker').first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
});
