import { test, expect } from './fixtures';
import { openApp, saved, showSection, downloadPDF } from './helpers';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const root = '/private/tmp/catalogmaker-priority1-artifacts';
const inspector = `/private/tmp/catalogmaker-inspect-recovery-${process.pid}`;

test.beforeAll(async () => {
  await mkdir(root, { recursive: true });
  await execute('swiftc', ['-module-cache-path', '/private/tmp/catalogmaker-swift-cache', 'tests/inspect-pdf.swift', '-o', inspector]);
});

interface Inspection {
  count: number;
  pages: { text: string[]; footerText: string[]; width: number; height: number; destinations: number[] }[];
}

async function inspectPDF(path: string): Promise<Inspection> {
  const result = await execute(inspector, [path]);
  await writeFile(`${path}.inspection.json`, result.stdout);
  return JSON.parse(result.stdout);
}

test('failed photo and text draft exports actual updated PDF and HTML and remains retryable', async ({ page, context }, testInfo) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(1, 1);
    const id = h.products.getState().products[0].id;
    await h.products.getState().replaceImage(id, await h.photo('old.png', '#d22135'));
    window.faults.failKey = 'cm:img:';
    await h.products.getState().replaceImage(id, await h.photo('draft.png', '#2266dd'));
    window.faults.failKey = 'cm:products';
    await h.products.getState().updateField(id, 'price', '$79999');
  });
  await expect(page.getByRole('button', { name: 'Reintentar guardado' }).first()).toBeVisible();
  const before = await page.evaluate(() => ({ images: window.catalogTest.products.getState().products.map((p) => p.image), created: window.faults.created, revoked: window.faults.revoked }));
  const prefix = `${root}/${testInfo.project.name}-failed-draft`;
  await writeFile(`${prefix}.pdf`, Buffer.from(await page.evaluate(() => window.catalogTest.output('pdf')), 'base64'));
  const pdf = await inspectPDF(`${prefix}.pdf`);
  expect(pdf.count).toBe(2);
  expect(pdf.pages[1].footerText.join(' ')).toContain('$79999');
  const html = await page.evaluate(() => window.catalogTest.output('html'));
  await writeFile(`${prefix}.html`, html);
  const images = [...html.matchAll(/class="pg" src="data:image\/jpeg;base64,([^"]+)"/g)];
  expect(images).toHaveLength(2);
  await writeFile(`${prefix}.html-last.jpg`, Buffer.from(images[1][1], 'base64'));
  const ocr = await execute(inspector, ['--images', `${prefix}.html-last.jpg`]);
  await writeFile(`${prefix}.html-text.json`, ocr.stdout);
  expect((JSON.parse(ocr.stdout) as { footerText: string[] }[])[0].footerText.join(' ')).toContain('$79999');
  const output = await context.newPage();
  for (const image of [await readFile(`${prefix}.page-2.png`), Buffer.from(images[1][1], 'base64')]) {
    const bluePixels = await output.evaluate(async (data) => {
      const img = new Image(); img.src = `data:image/png;base64,${data}`; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 50 && pixels[i + 1] > 80 && pixels[i + 1] < 125 && pixels[i + 2] > 195) count++;
      return count;
    }, image.toString('base64'));
    expect(bluePixels).toBeGreaterThan(1000);
  }
  await page.bringToFront();
  await output.close();
  const after = await page.evaluate(() => ({ images: window.catalogTest.products.getState().products.map((p) => p.image), created: window.faults.created, revoked: window.faults.revoked }));
  expect(after).toEqual(before);
  expect(await page.evaluate(() => window.catalogTest.persistence.getState().saving)).toBe('failed');
  await page.getByRole('button', { name: 'Reintentar guardado' }).first().click();
  await saved(page);
});

test('capture failure releases the export lock and wrapper; subsequent editing and output succeed', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = () => Promise.reject(new Error('Injected image decode failure'));
    let rejected = false;
    try { await h.output('pdf'); } catch { rejected = true; } finally { HTMLImageElement.prototype.decode = decode; }
    const after = { rejected, wrappers: document.querySelectorAll('.catalog-capture').length, exporting: h.persistence.getState().exporting, body: document.body.classList.contains('pdf-exporting') };
    const mutation = await h.products.getState().updateField(h.products.getState().products[0].id, 'price', '$456');
    await h.output('pdf');
    return { ...after, mutation: mutation.status };
  });
  expect(result).toEqual({ rejected: true, wrappers: 0, exporting: false, body: false, mutation: 'saved' });
});

test('actual mobile hook output follows reordered and shrinking page refs from both editing tabs', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(31, 1);
    const ids = h.products.getState().products.map((p) => p.id);
    await h.products.getState().moveProduct(ids[2], 'up');
    for (const id of ids.slice(3)) await h.products.getState().deleteProduct(id);
  });
  await expect(page.locator('.workspace .page-a4')).toHaveCount(4);
  for (const tab of ['Artículos', 'Páginas', 'Diseño'] as const) {
    await showSection(page, tab);
    const download = page.waitForEvent('download');
    await downloadPDF(page);
    const path = `${root}/${testInfo.project.name}-mobile-hook-${tab}.pdf`;
    await (await download).saveAs(path);
    const pdf = await inspectPDF(path);
    expect(pdf.count).toBe(4);
    expect(pdf.pages[0].destinations).toEqual([2, 3, 4]);
    expect(pdf.pages.slice(1).map((p) => p.text.join(' ').match(/PRODUCTO \d{3}/)?.[0])).toEqual(['PRODUCTO 001', 'PRODUCTO 003', 'PRODUCTO 002']);
    await expect(page.locator('body')).not.toHaveClass(/pdf-exporting/);
  }
  await page.evaluate(() => window.catalogTest.manageCatalog('products'));
  await expect(page.locator('.workspace .page-a4')).toHaveCount(0);
  await page.getByRole('button', { name: 'Exportar catálogo', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: 'Descargar PDF', exact: true })).toHaveAttribute('data-disabled', '');
});
