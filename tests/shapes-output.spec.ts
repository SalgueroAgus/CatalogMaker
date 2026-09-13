import { test, expect } from './fixtures';
import { openApp } from './helpers';
import { SHAPE_ITEM_COUNT } from '../src/types';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const root = '/private/tmp/catalogmaker-priority1-artifacts';
const inspector = `/private/tmp/catalogmaker-inspect-shapes-${process.pid}`;

test.beforeAll(async () => {
  await mkdir(root, { recursive: true });
  await execute('swiftc', ['-module-cache-path', '/private/tmp/catalogmaker-swift-cache', 'tests/inspect-pdf.swift', '-o', inspector]);
});

for (const [shape, count] of Object.entries(SHAPE_ITEM_COUNT)) {
  test(`actual shape ${shape}, occupancy ${count} of 5 fits and exports all products`, async ({ page }, testInfo) => {
    await openApp(page);
    await page.evaluate(async ({ shape, count }) => {
      const h = window.catalogTest;
      await h.fixture(count, 5);
      await h.settings.getState().setPageLayout(0, shape as Parameters<ReturnType<typeof h.settings.getState>['setPageLayout']>[1]);
    }, { shape, count });
    const layout = await page.locator('.product-grid').evaluate((grid) => {
      const bounds = grid.getBoundingClientRect();
      return Array.from(grid.children).map((cell) => {
        const rect = cell.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.left >= bounds.left - 1 && rect.top >= bounds.top - 1 && rect.right <= bounds.right + 1 && rect.bottom <= bounds.bottom + 1;
      });
    });
    expect(layout).toEqual(Array(count).fill(true));
    const prefix = `${root}/${testInfo.project.name}-shape-${shape}`;
    await writeFile(`${prefix}.pdf`, Buffer.from(await page.evaluate(() => window.catalogTest.output('pdf')), 'base64'));
    const inspection = await execute(inspector, [`${prefix}.pdf`]);
    await writeFile(`${prefix}.inspection.json`, inspection.stdout);
    const actual: { count: number; pages: { text: string[] }[] } = JSON.parse(inspection.stdout);
    expect(actual.count).toBe(2);
    const expected = Array.from({ length: count }, (_, i) => `PRODUCTO ${String(i + 1).padStart(3, '0')}`);
    expect((actual.pages[1].text.join(' ').match(/PRODUCTO \d{3}/g) ?? []).sort()).toEqual(expected);
    expect(actual.pages[1].text.join(' ')).not.toMatch(/Cambiar foto|Reintentar|Guardado en este navegador/);
    const html = await page.evaluate(() => window.catalogTest.output('html'));
    await writeFile(`${prefix}.html`, html);
    const images = [...html.matchAll(/class="pg" src="data:image\/jpeg;base64,([^"]+)"/g)];
    expect(images).toHaveLength(2);
    await writeFile(`${prefix}.html-last.jpg`, Buffer.from(images[1][1], 'base64'));
    const text = await execute(inspector, ['--images', `${prefix}.html-last.jpg`]);
    await writeFile(`${prefix}.html-text.json`, text.stdout);
    expect(((JSON.parse(text.stdout) as { text: string[] }[])[0].text.join(' ').match(/PRODUCTO \d{3}/g) ?? []).sort()).toEqual(expected);
  });
}
