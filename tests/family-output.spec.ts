import { test, expect } from './fixtures';
import { openApp } from './helpers';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const root = '/private/tmp/catalogmaker-family-feedback-artifacts';
const inspector = `/private/tmp/catalogmaker-family-inspector-${process.pid}`;
interface ImageText { text: string[]; headerText: string[]; footerText: string[] }
interface Inspection { count: number; pages: (ImageText & { width: number; height: number; destinations: number[] })[] }

test.beforeAll(async () => {
  await mkdir(root, { recursive: true });
  await execute('swiftc', ['-module-cache-path', '/private/tmp/catalogmaker-swift-cache', 'tests/inspect-pdf.swift', '-o', inspector]);
});

for (const count of [31, 61]) {
  test(`mixed page quantities preserve actual PDF and HTML content and links for ${count} products`, async ({ page, context }, testInfo) => {
    test.setTimeout(240000);
    await openApp(page);
    await page.evaluate(async (count) => {
      const h = window.catalogTest;
      await h.fixture(count, 5);
      for (const [index, capacity] of [1, 2, 3, 4].entries()) await h.settings.getState().setPageItemCount(index, capacity);
    }, count);
    const variants = count === 31 ? [[1, 2, 3, 4, 5, 5, 5, 5, 1], [5, 2, 3, 4, 5, 5, 5, 2]] : [[1, 2, 3, 4, ...Array(10).fill(5), 1]];
    for (const [iteration, capacities] of variants.entries()) {
      if (iteration) await page.evaluate(async () => {
        const h = window.catalogTest;
        await h.settings.getState().setPageItemCount(0, 5);
        await h.products.getState().updateField(h.products.getState().products[0].id, 'price', '$79999');
      });
      const indexes = Math.ceil(count / 30);
      const total = indexes + capacities.length;
      const targets = capacities.flatMap((capacity, index) => Array(capacity).fill(indexes + index + 1));
      expect(targets).toHaveLength(count);
      await expect(page.locator('.product-grid')).toHaveCount(capacities.length);
      const prefix = `${root}/${testInfo.project.name}-mixed-${count}-${iteration}`;
      await writeFile(`${prefix}.pdf`, Buffer.from(await page.evaluate(() => window.catalogTest.output('pdf')), 'base64'));
      const inspection = await execute(inspector, [`${prefix}.pdf`], { maxBuffer: 8 * 1024 * 1024 });
      await writeFile(`${prefix}.inspection.json`, inspection.stdout);
      const pdf: Inspection = JSON.parse(inspection.stdout);
      expect(pdf.count).toBe(total);
      for (const [index, actual] of pdf.pages.entries()) {
        expect(actual.width).toBeCloseTo(595.28, 1);
        expect(actual.height).toBeCloseTo(841.89, 1);
        expect(actual.headerText.join(' ')).toMatch(new RegExp(`P[áa]g[.,]? ?0?${index + 1}(?:\\D|$)`));
        if (index < indexes) expect(actual.destinations).toEqual(targets.slice(index * 30, index * 30 + 30));
      }
      let start = 1;
      for (const [index, capacity] of capacities.entries()) {
        const expected = Array.from({ length: capacity }, (_, offset) => `PRODUCTO ${String(start + offset).padStart(3, '0')}`);
        expect((pdf.pages[indexes + index].text.join(' ').match(/PRODUCTO \d{3}/g) ?? []).sort()).toEqual(expected);
        start += capacity;
      }
      const html = await page.evaluate(() => window.catalogTest.output('html'));
      await writeFile(`${prefix}.html`, html);
      const matches = [...html.matchAll(/class="pg" src="data:image\/jpeg;base64,([^"]+)"/g)];
      expect(matches).toHaveLength(total);
      const paths = matches.map((_, index) => `${prefix}.html-page-${index + 1}.jpg`);
      for (const [index, match] of matches.entries()) await writeFile(paths[index], Buffer.from(match[1], 'base64'));
      const text = await execute(inspector, ['--images', ...paths], { maxBuffer: 8 * 1024 * 1024 });
      await writeFile(`${prefix}.html-text.json`, text.stdout);
      const images: ImageText[] = JSON.parse(text.stdout);
      start = 1;
      for (const [index, capacity] of capacities.entries()) {
        const actual = images[indexes + index];
        const expected = Array.from({ length: capacity }, (_, offset) => `PRODUCTO ${String(start + offset).padStart(3, '0')}`);
        expect((actual.text.join(' ').match(/PRODUCTO \d{3}/g) ?? []).sort()).toEqual(expected);
        expect(actual.headerText.join(' ')).toMatch(new RegExp(`P[áa]g[.,]? ?0?${indexes + index + 1}(?:\\D|$)`));
        start += capacity;
      }
      const viewer = await context.newPage();
      await viewer.setContent(html);
      const links = await viewer.locator('.pg-wrap').evaluateAll((pages) => pages.map((page) => Array.from(page.querySelectorAll('a')).map((link) => link.getAttribute('href'))));
      for (let index = 0; index < indexes; index++) expect(links[index]).toEqual(targets.slice(index * 30, index * 30 + 30).map((target) => `#page-${target - 1}`));
      await page.bringToFront();
      await viewer.close();
    }
  });
}

test('product backdrop blocks the page image and enlarged description reaches actual PDF and HTML', async ({ page, context }, testInfo) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(1, 1);
    const id = h.products.getState().products[0].id;
    await h.products.getState().replaceImage(id, await h.photo());
    await h.products.getState().updateField(id, 'bgColor', 'rgba(255,255,255,0)');
    await h.products.getState().updateField(id, 'description', 'Texto descriptivo con varias líneas para probar el tamaño. '.repeat(5) + 'TEXTO FINAL CORRECTO');
    await h.settings.getState().setBgImage(await h.photo('background.png', '#2060b0'));
    await h.settings.getState().setBgImageOpacity(1);
    await h.settings.getState().updateFontSize('body', 22);
  });
  const sample = await page.locator('.cell-img-area').evaluate((area) => {
    const page = area.closest('.page-a4')!.getBoundingClientRect();
    const rect = area.getBoundingClientRect();
    return { x: (rect.left + 14 - page.left) / page.width, y: (rect.top + 14 - page.top) / page.height };
  });
  const prefix = `${root}/${testInfo.project.name}-backdrop-description`;
  await writeFile(`${prefix}.pdf`, Buffer.from(await page.evaluate(() => window.catalogTest.output('pdf')), 'base64'));
  const inspected = await execute(inspector, [`${prefix}.pdf`]);
  await writeFile(`${prefix}.inspection.json`, inspected.stdout);
  const pdf: Inspection = JSON.parse(inspected.stdout);
  expect(pdf.pages[1].text.join(' ')).toContain('TEXTO FINAL CORRECTO');
  const html = await page.evaluate(() => window.catalogTest.output('html'));
  await writeFile(`${prefix}.html`, html);
  const matches = [...html.matchAll(/class="pg" src="data:image\/jpeg;base64,([^"]+)"/g)];
  expect(matches).toHaveLength(2);
  await writeFile(`${prefix}.html-last.jpg`, Buffer.from(matches[1][1], 'base64'));
  const ocr = await execute(inspector, ['--images', `${prefix}.html-last.jpg`]);
  expect((JSON.parse(ocr.stdout) as ImageText[])[0].text.join(' ')).toContain('TEXTO FINAL CORRECTO');
  const viewer = await context.newPage();
  for (const [format, bytes] of [['pdf', await readFile(`${prefix}.page-2.png`)], ['html', Buffer.from(matches[1][1], 'base64')]] as const) {
    const pixels = await viewer.evaluate(async ({ data, sample }) => {
      const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
      return { product: Array.from(context.getImageData(Math.round(sample.x * canvas.width), Math.round(sample.y * canvas.height), 1, 1).data).slice(0, 3), page: Array.from(context.getImageData(10, 10, 1, 1).data).slice(0, 3) };
    }, { data: bytes.toString('base64'), sample });
    expect(pixels.product, format).toEqual([255, 255, 255]);
    expect(pixels.page.every((value, index) => Math.abs(value - [32, 96, 176][index]) <= 6), format).toBe(true);
  }
  await page.bringToFront();
  await viewer.close();
});
