import { test, expect } from './fixtures';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { openApp } from './helpers';

const execute = promisify(execFile);
const artifactRoot = '/private/tmp/catalogmaker-priority1-artifacts';
const inspector = `/private/tmp/catalogmaker-inspect-pdf-${process.pid}`;
interface ImageText { text: string[]; headerText: string[]; footerText: string[] }

test.beforeAll(async () => {
  await execute('swiftc', ['-module-cache-path', '/private/tmp/catalogmaker-swift-cache', 'tests/inspect-pdf.swift', '-o', inspector]);
});
interface PDFInspection {
  count: number;
  pages: (ImageText & { width: number; height: number; destinations: number[]; corner: number[]; text: string[] })[];
}

for (const count of [1, 30, 31, 60, 61]) {
  for (const perPage of [1, 2, 3, 4, 5]) {
    test(`actual PDF and HTML ${count} products / ${perPage} per page`, async ({ page, context }, testInfo) => {
      test.setTimeout(240000);
      await mkdir(artifactRoot, { recursive: true });
      await openApp(page);
      await page.evaluate(async ({ count, perPage }) => {
        const h = window.catalogTest;
        await h.fixture(count, perPage);
        await h.settings.getState().setBgImage(await h.photo('fondo.png', '#2060b0'));
      }, { count, perPage });
      const indexCount = Math.ceil(count / 30);
      const total = indexCount + Math.ceil(count / perPage);
      await expect(page.locator('.workspace .page-a4')).toHaveCount(total);
      const prefix = `${artifactRoot}/${testInfo.project.name}-${count}-${perPage}`;
      const pdf = await page.evaluate(() => window.catalogTest.output('pdf'));
      await writeFile(`${prefix}.pdf`, Buffer.from(pdf, 'base64'));
      const inspection = await execute(inspector, [`${prefix}.pdf`], { maxBuffer: 8 * 1024 * 1024 });
      await writeFile(`${prefix}.inspection.json`, inspection.stdout);
      const actual: PDFInspection = JSON.parse(inspection.stdout);
      expect(actual.count).toBe(total);
      for (const [i, data] of actual.pages.entries()) {
        expect(data.width).toBeCloseTo(595.28, 1);
        expect(data.height).toBeCloseTo(841.89, 1);
        expect(data.headerText.join(' ')).toMatch(new RegExp(`P[áa]g[.,]? ?0?${i + 1}(?:\\D|$)`));
        const expected = [217, 227, 239];
        expect(data.corner.every((channel, j) => Math.abs(channel - expected[j]) <= 6)).toBe(true);
        if (i < indexCount) {
          const start = i * 30;
          const length = Math.min(30, count - start);
          expect(data.destinations).toEqual(Array.from({ length }, (_, j) => Math.floor((start + j) / perPage) + indexCount + 1));
        }
      }
      const lastCount = count % perPage || perPage;
      expect(actual.pages.at(-1)!.text.filter((value) => /PRODUCTO \d{3}/.test(value)).join(' ').match(/PRODUCTO \d{3}/g)).toHaveLength(lastCount);
      const html = await page.evaluate(() => window.catalogTest.output('html'));
      expect(await page.evaluate(() => document.querySelectorAll('.catalog-capture').length)).toBe(0);
      await writeFile(`${prefix}.html`, html);
      const imagePaths: string[] = [];
      for (const [index, match] of [...html.matchAll(/class="pg" src="data:image\/jpeg;base64,([^"]+)"/g)].entries()) {
        const path = `${prefix}.html-page-${index + 1}.jpg`;
        await writeFile(path, Buffer.from(match[1], 'base64'));
        imagePaths.push(path);
      }
      expect(imagePaths).toHaveLength(total);
      const htmlOCR = await execute(inspector, ['--images', ...imagePaths], { maxBuffer: 8 * 1024 * 1024 });
      await writeFile(`${prefix}.html-text.json`, htmlOCR.stdout);
      const htmlText: ImageText[] = JSON.parse(htmlOCR.stdout);
      for (const [i, text] of htmlText.entries()) expect(text.headerText.join(' ')).toMatch(new RegExp(`P[áa]g[.,]? ?0?${i + 1}(?:\\D|$)`));
      expect(htmlText.at(-1)!.text.join(' ').match(/PRODUCTO \d{3}/g)).toHaveLength(lastCount);
      const standalone = await context.newPage();
      await standalone.setContent(await readFile(`${prefix}.html`, 'utf8'));
      const htmlResult = await standalone.evaluate(async () => {
        const images = Array.from(document.querySelectorAll<HTMLImageElement>('img.pg'));
        await Promise.all(images.map((image) => image.decode()));
        return images.map((image) => {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0);
          return { width: image.naturalWidth, height: image.naturalHeight, corner: Array.from(ctx.getImageData(10, 10, 1, 1).data).slice(0, 3), links: Array.from(image.parentElement!.querySelectorAll('a')).map((link) => link.getAttribute('href')) };
        });
      });
      await writeFile(`${prefix}.html-inspection.json`, JSON.stringify(htmlResult, null, 2));
      expect(htmlResult).toHaveLength(total);
      for (const [i, data] of htmlResult.entries()) {
        expect(data.width / data.height).toBeCloseTo(210 / 297, 3);
        expect(data.corner.every((channel, j) => Math.abs(channel - [217, 227, 239][j]) <= 6)).toBe(true);
        if (i < indexCount) expect(data.links).toEqual(actual.pages[i].destinations.map((destination) => `#page-${destination - 1}`));
      }
      await standalone.screenshot({ path: `${prefix}.html.png` });
      await page.bringToFront();
      await standalone.close();
    });
  }
}

for (const opacity of [null, 0, 0.15, 1]) {
  test(`repeated actual output after editing with background opacity ${opacity}`, async ({ page, context }, testInfo) => {
    await mkdir(artifactRoot, { recursive: true });
    await openApp(page);
    await page.evaluate(async (opacity) => {
      const h = window.catalogTest;
      await h.fixture(2, 5);
      await h.products.getState().replaceImage(h.products.getState().products[0].id, await h.photo());
      if (opacity !== null) {
        await h.settings.getState().setBgImage(await h.photo('fondo.png', '#2060b0'));
        await h.settings.getState().setBgImageOpacity(opacity);
      }
    }, opacity);
    for (const iteration of [1, 2]) {
      await page.evaluate(async (iteration) => {
        const h = window.catalogTest;
        await h.products.getState().updateField(h.products.getState().products[0].id, 'price', `$${iteration}9999`);
      }, iteration);
      const before = await page.evaluate(() => ({ images: window.catalogTest.products.getState().products.map((p) => p.image), created: window.faults.created.length, revoked: window.faults.revoked.length }));
      const prefix = `${artifactRoot}/${testInfo.project.name}-opacity-${opacity}-${iteration}`;
      await writeFile(`${prefix}.pdf`, Buffer.from(await page.evaluate(() => window.catalogTest.output('pdf')), 'base64'));
      const inspection = await execute(inspector, [`${prefix}.pdf`], { maxBuffer: 8 * 1024 * 1024 });
      await writeFile(`${prefix}.inspection.json`, inspection.stdout);
      const actual: PDFInspection = JSON.parse(inspection.stdout);
      expect(actual.count).toBe(2);
      expect(actual.pages[1].text.join(' ')).toContain(`$${iteration}9999`);
      const alpha = opacity ?? 0;
      const expected = [32, 96, 176].map((color) => Math.round(250 * (1 - alpha) + color * alpha));
      for (const page of actual.pages) expect(page.corner.every((color, i) => Math.abs(color - expected[i]) <= 6)).toBe(true);
      const html = await page.evaluate(() => window.catalogTest.output('html'));
      await writeFile(`${prefix}.html`, html);
      const matches = [...html.matchAll(/class="pg" src="data:image\/jpeg;base64,([^"]+)"/g)];
      expect(matches).toHaveLength(2);
      const images = matches.map((_, i) => `${prefix}.html-page-${i + 1}.jpg`);
      for (const [i, match] of matches.entries()) await writeFile(images[i], Buffer.from(match[1], 'base64'));
      const ocr = await execute(inspector, ['--images', ...images]);
      await writeFile(`${prefix}.html-text.json`, ocr.stdout);
      const text: ImageText[] = JSON.parse(ocr.stdout);
      expect(text[1].footerText.join(' ')).toContain(`$${iteration}9999`);
      expect(text[0].headerText.join(' ')).toMatch(/P[áa]g[.,]? 01/);
      expect(text[1].headerText.join(' ')).toMatch(/P[áa]g[.,]? 02/);
      const viewer = await context.newPage();
      await viewer.setContent(html);
      const corners = await viewer.evaluate(async () => Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('img.pg')).map(async (image) => {
        await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0);
        return Array.from(ctx.getImageData(10, 10, 1, 1).data).slice(0, 3);
      })));
      expect(corners.every((corner) => corner.every((color, i) => Math.abs(color - expected[i]) <= 6))).toBe(true);
      await page.bringToFront();
      await viewer.close();
      const after = await page.evaluate(() => ({ images: window.catalogTest.products.getState().products.map((p) => p.image), created: window.faults.created.length, revoked: window.faults.revoked.length }));
      expect(after).toEqual(before);
      expect(await page.evaluate(() => document.querySelectorAll('.catalog-capture').length)).toBe(0);
    }
  });
}
