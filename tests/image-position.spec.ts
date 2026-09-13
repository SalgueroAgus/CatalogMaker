import { test, expect } from './fixtures';
import { openApp, readyAfterReload, saved } from './helpers';
import type { Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { SHAPE_ITEM_COUNT } from '../src/types';

const execute = promisify(execFile);

async function fixture(page: Page) {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(3);
    await h.settings.getState().setPageLayout(0, 'trio-right');
    const product = h.products.getState().products[2];
    await h.products.getState().replaceImage(product.id, await h.photo());
    await h.products.getState().updateField(product.id, 'bgColor', 'transparent');
  });
  await page.locator('.product-cell').last().scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
}

async function geometry(page: Page) {
  return page.locator('.product-cell').last().evaluate((cell) => {
    const frame = cell.querySelector('.cell-img-frame')!.getBoundingClientRect();
    const img = cell.querySelector('img')!.getBoundingClientRect();
    return { top: img.top, bottom: img.bottom, left: img.left, width: img.width, height: img.height, frameTop: frame.top, frameBottom: frame.bottom, freeSpace: frame.height - img.height };
  });
}

async function startDrag(page: Page) {
  const image = await geometry(page);
  const x = image.left + image.width / 2;
  const y = image.top + image.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  return { ...image, x, y };
}

for (const width of [1440, 900]) {
  test(`drag moves the photo without scaling or cropping and saves once at width ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await fixture(page);
    const before = await startDrag(page);
    const writes = await page.evaluate(() => window.faults.writes);
    await page.mouse.move(before.x + 30, before.y + 80, { steps: 8 });
    const moved = await geometry(page);
    expect(moved.top - before.top).toBeCloseTo(80, 0);
    expect(moved.width).toBeCloseTo(before.width, 1);
    expect(moved.height).toBeCloseTo(before.height, 1);
    expect(moved.left).toBeCloseTo(before.left, 1);
    expect(await page.evaluate(() => window.faults.writes)).toBe(writes);
    await page.mouse.up();
    await saved(page);
    expect(await page.evaluate(() => window.faults.writes)).toBe(writes + 1);
    const position = await page.evaluate(() => window.catalogTest.products.getState().products[2].imagePositionY);
    expect(position).toBeGreaterThan(50);
    await readyAfterReload(page);
    expect(await page.evaluate(() => window.catalogTest.products.getState().products[2].imagePositionY)).toBe(position);
    const frame = page.locator('.cell-img-frame').last();
    await frame.focus();
    await page.keyboard.press('Home');
    await saved(page);
    const top = await geometry(page);
    expect(top.top).toBeCloseTo(top.frameTop, 0);
    await page.keyboard.press('End');
    await saved(page);
    const bottom = await geometry(page);
    expect(bottom.bottom).toBeCloseTo(bottom.frameBottom, 0);
    await page.getByRole('button', { name: 'Centrar foto de PRODUCTO 003' }).click();
    await saved(page);
    expect(await frame.getAttribute('aria-valuenow')).toBe('50');
    expect(await page.evaluate(() => window.catalogTest.products.getState().products.slice(0, 2).map((product) => product.imagePositionY))).toEqual([50, 50]);
  });
}

test('drag cancellation, export locking, failed save retry and replacement preserve consistent positions', async ({ page }) => {
  await fixture(page);
  for (const cancel of ['escape', 'pointer', 'blur', 'export']) {
    const before = await startDrag(page);
    await page.mouse.move(before.x, before.y - 80, { steps: 3 });
    if (cancel === 'escape') await page.keyboard.press('Escape');
    if (cancel === 'pointer') await page.locator('.cell-img-frame').last().dispatchEvent('pointercancel', { pointerId: 1 });
    if (cancel === 'blur') await page.locator('.cell-name').last().focus();
    if (cancel === 'export') {
      await page.evaluate(() => window.catalogTest.persistence.setState({ exporting: true }));
      await expect(page.locator('.cell-img-frame').last()).toHaveAttribute('aria-disabled', 'true');
    }
    await page.mouse.up();
    const restored = await geometry(page);
    expect(restored.top - restored.frameTop).toBeCloseTo(before.top - before.frameTop, 0);
    expect(await page.evaluate(() => window.catalogTest.products.getState().products[2].imagePositionY)).toBe(50);
    if (cancel === 'export') await page.evaluate(() => window.catalogTest.persistence.setState({ exporting: false }));
  }
  await page.evaluate(() => { window.faults.failKey = 'cm:products'; });
  await page.locator('.cell-img-frame').last().focus();
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => page.evaluate(() => window.catalogTest.persistence.getState().saving)).toBe('failed');
  expect(await page.evaluate(async () => (await window.catalogTest.dbLoadCatalog()).products[2].imagePositionY)).toBe(50);
  await page.evaluate(() => window.catalogTest.retrySave());
  await saved(page);
  await readyAfterReload(page);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products[2].imagePositionY)).toBe(45);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.products.getState().replaceImage(h.products.getState().products[2].id, await h.photo('replacement.png'));
  });
  expect(await page.locator('.cell-img-frame').last().getAttribute('aria-valuenow')).toBe('50');
});

test('legacy products center by default and touch gestures do not reposition photos', async ({ page }) => {
  await fixture(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    const products = h.products.getState().products.map(({ imagePositionY: _position, ...product }) => product);
    h.products.getState().hydrateProducts(products);
    await h.products.getState().updateField(products[0].id, 'name', 'Legacy');
  });
  await readyAfterReload(page);
  await expect(page.locator('.cell-img-frame').last()).toHaveAttribute('aria-valuenow', '50');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Vista previa', exact: true }).click();
  const frame = page.locator('.cell-img-frame').last();
  await frame.locator('img').dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 2, isPrimary: true, clientY: 400 });
  await frame.dispatchEvent('pointermove', { pointerType: 'touch', pointerId: 2, isPrimary: true, clientY: 100 });
  await frame.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 2, isPrimary: true, clientY: 100 });
  await expect(frame).toHaveAttribute('aria-valuenow', '50');
  expect(await frame.evaluate((element) => getComputedStyle(element).touchAction)).toBe('auto');
});

test('large landscape and portrait photos fit all layouts at either vertical limit', async ({ page }) => {
  await openApp(page);
  for (const [shape, count] of Object.entries(SHAPE_ITEM_COUNT)) {
    await page.evaluate(async ({ shape, count }) => {
      const h = window.catalogTest;
      await h.fixture(count, count);
      await h.settings.getState().setPageLayout(0, shape as Parameters<ReturnType<typeof h.settings.getState>['setPageLayout']>[1]);
      const canvas = document.createElement('canvas');
      canvas.width = count % 2 ? 1600 : 400;
      canvas.height = count % 2 ? 400 : 1600;
      canvas.getContext('2d')!.fillRect(0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!)));
      for (const [index, product] of h.products.getState().products.entries()) {
        await h.products.getState().replaceImage(product.id, new File([blob], 'large.png', { type: 'image/png' }));
        await h.products.getState().setImagePosition(product.id, index % 2 ? 100 : 0);
      }
      await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('.cell-img-frame img')).map((image) => image.decode()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }, { shape, count });
    const fits = await page.locator('.cell-img-frame').evaluateAll((frames) => frames.map((frame) => {
      const bounds = frame.getBoundingClientRect();
      const image = frame.querySelector('img')!;
      const photo = image.getBoundingClientRect();
      return photo.top >= bounds.top - 1 && photo.bottom <= bounds.bottom + 1 && photo.left >= bounds.left - 1 && photo.right <= bounds.right + 1 && Math.abs(photo.width / photo.height - image.naturalWidth / image.naturalHeight) < 0.01;
    }));
    expect(fits, shape).toEqual(Array(count).fill(true));
  }
});

test('printing keeps the photo aligned and hides position controls and focus outlines', async ({ page }) => {
  await fixture(page);
  const frame = page.locator('.cell-img-frame').last();
  await frame.focus();
  await page.keyboard.press('Home');
  await saved(page);
  await expect(frame).toBeFocused();
  await page.emulateMedia({ media: 'print' });
  const photo = await geometry(page);
  expect(photo.top).toBeCloseTo(photo.frameTop, 0);
  expect(await frame.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('none');
  await expect(page.getByRole('button', { name: 'Centrar foto de PRODUCTO 003' })).toBeHidden();
  await expect(page.locator('.cell-img-hint')).toBeHidden();
});

async function redBounds(page: Page, source: string) {
  return page.evaluate(async (source) => {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let top = canvas.height;
    let bottom = 0;
    let left = canvas.width;
    let right = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        if (pixels[offset] > 150 && pixels[offset + 1] < 80 && pixels[offset + 2] < 100) {
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      }
    }
    return { top: top / canvas.height, bottom: bottom / canvas.height, left: left / canvas.width, right: right / canvas.width };
  }, source);
}

test('PDF and HTML raster images preserve the moved photo bounds', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 900, height: 1100 });
  await fixture(page);
  const inspector = testInfo.outputPath('inspect-pdf');
  await execute('swiftc', ['-module-cache-path', '/private/tmp/catalogmaker-swift-cache', 'tests/inspect-pdf.swift', '-o', inspector]);
  for (const key of ['Home', 'End']) {
    await page.locator('.cell-img-frame').last().focus();
    await page.keyboard.press(key);
    await saved(page);
    const expected = await page.locator('.product-cell').last().evaluate((cell) => {
      const page = cell.closest('.page-a4')!.getBoundingClientRect();
      const img = cell.querySelector('img')!.getBoundingClientRect();
      return { top: (img.top - page.top) / page.height, bottom: (img.bottom - page.top) / page.height, left: (img.left - page.left) / page.width, right: (img.right - page.left) / page.width };
    });
    const html = await page.evaluate(() => window.catalogTest.output('html'));
    const images = [...html.matchAll(/class="pg" src="(data:image\/jpeg;base64,[^"]+)"/g)];
    expect(images).toHaveLength(2);
    const htmlBounds = await redBounds(page, images[1][1]);
    const pdfPath = testInfo.outputPath(`${key}.pdf`);
    await writeFile(pdfPath, Buffer.from(await page.evaluate(() => window.catalogTest.output('pdf')), 'base64'));
    const inspection = JSON.parse((await execute(inspector, [pdfPath])).stdout) as { pages: { text: string[] }[] };
    expect(inspection.pages[1].text.join(' ')).not.toMatch(/Arrastrá|Centrar|Cambiar foto/);
    const png = await readFile(testInfo.outputPath(`${key}.page-2.png`));
    const pdfBounds = await redBounds(page, `data:image/png;base64,${png.toString('base64')}`);
    for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
      expect(Math.abs(htmlBounds[edge] - expected[edge])).toBeLessThan(0.005);
      expect(Math.abs(pdfBounds[edge] - expected[edge])).toBeLessThan(0.005);
    }
  }
  await page.screenshot({ path: testInfo.outputPath('position-preview.png') });
});
