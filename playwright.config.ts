import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;
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
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', testIgnore: '**/zoom.spec.ts', use: { browserName: 'firefox' } },
    { name: 'webkit', testIgnore: '**/zoom.spec.ts', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
  },
});
