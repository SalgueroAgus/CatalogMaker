import { test as base, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const test = base.extend({
  context: async ({ playwright, browserName, baseURL, viewport }, use) => {
    const profile = await mkdtemp(join(tmpdir(), 'catalogmaker-test-'));
    const context = await playwright[browserName].launchPersistentContext(profile, { headless: true, baseURL, viewport });
    try {
      await use(context);
    } finally {
      await context.close();
      await rm(profile, { recursive: true, force: true });
    }
  },
  page: async ({ context }, use) => {
    await use(context.pages()[0] ?? await context.newPage());
  },
});

export { expect };
