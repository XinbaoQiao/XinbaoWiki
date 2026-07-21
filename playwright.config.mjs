import { defineConfig } from '@playwright/test';

const externalBaseUrl = process.env.CUBE_GEOMETRY_BASE_URL;

export default defineConfig({
  fullyParallel: false,
  reporter: 'line',
  retries: 0,
  testDir: './tests/browser',
  timeout: 45_000,
  use: {
    baseURL: externalBaseUrl || 'http://127.0.0.1:3210',
    headless: true,
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 1200 },
  },
  webServer: externalBaseUrl ? undefined : {
    command: 'npm run start -- --port 3210',
    reuseExistingServer: false,
    timeout: 60_000,
    url: 'http://127.0.0.1:3210',
  },
  workers: 1,
});
