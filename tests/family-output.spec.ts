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

for (const scenario of [
  { name: '0-percent', bgColor: 'rgba(255,255,255,0)', image: true, alphas: [0, 0, 0] },
  { name: '50-percent', bgColor: 'rgba(255,255,255,0.5)', image: true, alphas: [0.5, 0.5, 0.5] },
  { name: '100-percent-default', bgColor: null, image: true, alphas: [1, 1, 1] },
  { name: 'gradient', bgColor: 'linear-gradient(90deg, rgba(255,255,255,0) 25%, rgba(255,255,255,1) 75%)', image: true, alphas: [0, 1, 0.5] },
  { name: 'no-page-image', bgColor: 'rgba(255,255,255,0)', image: false, alphas: [0, 0, 0] },
]) {
  test(`photo backdrop ${scenario.name} preserves transparency and description in preview, PDF and HTML`, async ({ page, context }, testInfo) => {
    await page.setViewportSize({ width: 1800, height: 1500 });
    await openApp(page);
    await page.evaluate(async ({ bgColor, image }) => {
      const h = window.catalogTest;
      await h.fixture(1, 1);
      const id = h.products.getState().products[0].id;
      const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 128;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 64, 96, 64);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!)));
      await h.products.getState().replaceImage(id, new File([blob], 'transparent.png', { type: 'image/png' }));
      if (bgColor !== null) await h.products.getState().updateField(id, 'bgColor', bgColor);
      await h.products.getState().updateField(id, 'description', 'Texto descriptivo con varias líneas para probar el tamaño. '.repeat(5) + 'TEXTO FINAL CORRECTO');
      await h.settings.getState().updateColor('bg', '#d8e8c8');
      if (image) await h.settings.getState().setBgImage(await h.photo('background.png', '#2060b0'));
      await h.settings.getState().setBgImageOpacity(1);
      await h.settings.getState().updateFontSize('body', 22);
    }, scenario);
    const sheet = page.locator('.workspace .page-a4').last();
    await sheet.locator('.cell-img-area img').evaluate((image: HTMLImageElement) => image.decode());
    await sheet.evaluate(async (element) => {
      await document.fonts.ready;
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished));
    });
    const prefix = `${root}/${testInfo.project.name}-backdrop-${scenario.name}`;
    const preview = await sheet.screenshot({ path: `${prefix}.preview.png` });
    const samples = await sheet.locator('.cell-img-area').evaluate((area) => {
      const sheet = area.closest('.page-a4')!;
      const page = sheet.getBoundingClientRect();
      const rect = area.getBoundingClientRect();
      const photo = area.querySelector('img')!.getBoundingClientRect();
      const info = sheet.querySelector('.cell-info')!.getBoundingClientRect();
      return [
        [rect.left + 14, rect.top + 14],
        [rect.right - 14, rect.top + 14],
        [photo.left + photo.width / 2, photo.top + photo.height / 4],
        [photo.left + photo.width / 2, photo.top + photo.height * 3 / 4],
        [info.left + info.width / 2, info.bottom - 4],
        [page.left + 14, page.top + 14],
      ].map(([x, y]) => ({ x: (x - page.left) / page.width, y: (y - page.top) / page.height }));
    });
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
    const pageColor = [216, 232, 200];
    const background = scenario.image ? [32, 96, 176] : pageColor;
    const expected = [
      ...scenario.alphas.map((alpha) => background.map((channel) => Math.round(255 * alpha + channel * (1 - alpha)))),
      [255, 255, 255],
      pageColor,
      background,
    ];
    const viewer = await context.newPage();
    try {
      for (const [format, mime, bytes] of [
        ['preview', 'image/png', preview],
        ['pdf', 'image/png', await readFile(`${prefix}.page-2.png`)],
        ['html', 'image/jpeg', Buffer.from(matches[1][1], 'base64')],
      ] as const) {
        const pixels = await viewer.evaluate(async ({ data, mime, samples }) => {
          const image = new Image(); image.src = `data:${mime};base64,${data}`; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
          return samples.map(({ x, y }) => Array.from(context.getImageData(Math.round(x * canvas.width), Math.round(y * canvas.height), 1, 1).data).slice(0, 3));
        }, { data: bytes.toString('base64'), mime, samples });
        for (const [index, pixel] of pixels.entries()) {
          for (const [channel, value] of pixel.entries()) {
            expect(Math.abs(value - expected[index][channel]), `${format} sample ${index} RGB ${pixel}`).toBeLessThanOrEqual(6);
          }
        }
      }
    } finally {
      await viewer.close();
      await page.bringToFront();
    }
  });
}
