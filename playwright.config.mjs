import { defineConfig } from '@playwright/test';

const externalBaseUrl = process.env.CUBE_GEOMETRY_BASE_URL;
const deploymentBrowserUserAgent = 'xinbaopedia-deployment-browser-qa/1';
// This is a test-only fixture. It is a scrypt envelope, not a production password.
// Production deployments must provide their own SITE_ACTIVITY_OWNER_PASSWORD_HASH.
const testOwnerPasswordHash = 'scrypt:v1:00112233445566778899aabbccddeeff:f80d13e01978a648a1b185ea9dc59617791687a22e92e43715ca683803408c63';

export default defineConfig({
  fullyParallel: false,
  reporter: 'line',
  retries: 0,
  testDir: './tests/browser',
  timeout: 45_000,
  use: {
    baseURL: externalBaseUrl || 'http://localhost:3210',
    headless: true,
    reducedMotion: 'reduce',
    ...(externalBaseUrl ? { userAgent: deploymentBrowserUserAgent } : {}),
    viewport: { width: 1440, height: 1200 },
  },
  webServer: externalBaseUrl ? undefined : {
    command: 'npm run start -- --port 3210',
    env: {
      ...process.env,
      RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT || 'playwright-only-site-activity-salt',
      SITE_ACTIVITY_OWNER_PASSWORD_HASH: process.env.SITE_ACTIVITY_OWNER_PASSWORD_HASH || testOwnerPasswordHash,
      SITE_ACTIVITY_TEST_MODE: 'true',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || 'playwright-only-token',
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || 'https://playwright.invalid'
    },
    reuseExistingServer: false,
    timeout: 60_000,
    url: 'http://127.0.0.1:3210',
  },
  workers: 1,
});
