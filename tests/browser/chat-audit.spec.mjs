import { expect, test } from '@playwright/test';

const activityPath = `${(process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')}/api/site-activity/v2/`;

test.use({ userAgent: 'xinbaopedia-deployment-browser-qa/1' });

for (const scenario of [
  { width: 1440, language: 'en' }, { width: 375, language: 'en' },
  { width: 375, language: 'zh' }, { width: 320, language: 'zh' },
]) {
  test(`private audit notice and conversation grouping at ${scenario.width}px ${scenario.language}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    const requests = [];
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await page.route(url => url.pathname === activityPath, route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(route.request().method() === 'POST' ? {} : {
        cells: [], enabled: false, generatedAt: '2026-10-19T03:00:00Z',
        period: { scope: 'lifetime', since: '2026-08-09' }, schemaVersion: 2,
        thresholds: { cell: 2, total: 2 }, uniqueBrowsersEstimate: null,
      }),
    }));
    await page.route('**/api/chat-with-xinbao/', async route => {
      if (route.request().method() === 'POST') {
        requests.push(route.request().postDataJSON());
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'Local audit interaction fixture.', remaining: 9, limit: 10, sources: [] }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ remaining: 10, limit: 10, meta: { modelApiConfigured: true } }) });
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    if (scenario.language === 'zh') await page.getByRole('group', { name: 'Search language', exact: true }).getByRole('button', { name: '中文', exact: true }).click();
    await page.locator('.chat-xinbao-trigger').click();
    const dialog = page.getByRole('dialog', { name: 'Chat with Xinbao', exact: true });
    const notice = dialog.locator('.chat-xinbao-audit-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(scenario.language === 'zh' ? '365 天' : '365 days');
    expect(requests).toHaveLength(0);
    const geometry = await notice.evaluate(node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, viewportHeight: innerHeight,
        viewportWidth: innerWidth, visibility: style.visibility, display: style.display,
        overflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.overflow).toBe(false);
    await dialog.locator('textarea').fill('First audit browser fixture');
    await dialog.getByRole('button', { name: scenario.language === 'zh' ? '发送' : 'Send', exact: true }).click();
    await expect(dialog).toContainText('Local audit interaction fixture.');
    expect(requests).toHaveLength(1);
    expect(requests[0].conversationId).toMatch(/^[a-f0-9-]{36}$/);
    expect(requests[0].history).toBeUndefined();
    await dialog.getByRole('button', { name: scenario.language === 'zh' ? '新对话' : 'New chat', exact: true }).click();
    await dialog.locator('textarea').fill('Second audit browser fixture');
    await dialog.getByRole('button', { name: scenario.language === 'zh' ? '发送' : 'Send', exact: true }).click();
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1].conversationId).not.toBe(requests[0].conversationId);
    expect(requests[1].language).toBe(scenario.language);
    expect(errors).toEqual([]);
  });
}
