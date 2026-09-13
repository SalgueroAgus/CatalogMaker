import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;
const testPort = process.env.CATALOG_TEST_PORT ?? '5173';
const testUrl = `http://127.0.0.1:${testPort}`;
const outputDir = isCI ? 'test-results' : '/private/tmp/catalogmaker-priority1-results';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: 0,
  workers: 1,
  outputDir,
  reporter: isCI
    ? [['list'], ['json', { outputFile: `${outputDir}/report.json` }], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['json', { outputFile: `${outputDir}/report.json` }]],
  use: {
    baseURL: testUrl,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: process.env.CATALOG_TEST_CHROME === '1' ? { channel: 'chrome' } : {} } },
    { name: 'webkit', testIgnore: '**/zoom.spec.ts', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${testPort} --strictPort`,
    url: testUrl,
    reuseExistingServer: false,
  },
});
