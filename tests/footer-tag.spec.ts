import { test, expect } from './fixtures';
import { openApp, readyAfterReload, saved, showSection } from './helpers';
import { writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

test('footer tag edits every page, persists empty values and resets to the default', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(4));
  await showSection(page, 'Diseño');
  const field = page.getByRole('textbox', { name: 'Etiqueta del pie', exact: true });
  const tags = page.locator('.workspace .footer-tag');
  await expect(field).toHaveValue('Exclusivo');
  await expect(tags).toHaveText(['Exclusivo', 'Exclusivo', 'Exclusivo']);
  await field.fill('Nueva colección');
  await expect(tags).toHaveText(['Nueva colección', 'Nueva colección', 'Nueva colección']);
  await saved(page);
  await readyAfterReload(page);
  await expect(tags).toHaveText(['Nueva colección', 'Nueva colección', 'Nueva colección']);
  await showSection(page, 'Diseño');
  for (const value of ['', '   ']) {
    await field.fill(value);
    await expect(tags).toHaveCount(0);
    await saved(page);
    await readyAfterReload(page);
    await expect(tags).toHaveCount(0);
    await showSection(page, 'Diseño');
    await expect(field).toHaveValue(value);
  }
  await page.evaluate(() => window.catalogTest.settings.getState().resetSettings());
  await readyAfterReload(page);
  await expect(tags).toHaveText(['Exclusivo', 'Exclusivo', 'Exclusivo']);
});

test('legacy settings keep Exclusivo and malformed footer tags fail without overwriting data', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  for (const malformed of [false, true]) {
    await page.evaluate(async (malformed) => {
      const data = await window.catalogTest.dbLoadCatalog();
      const settings = { ...data.settings };
      delete settings.footerTag;
      const request = indexedDB.open('keyval-store');
      const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
      const tx = db.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put(malformed ? { ...settings, footerTag: 42 } : settings, `cm:catalog:${window.catalogTest.catalogs.getState().activeId}:settings`);
      await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); });
      db.close();
    }, malformed);
    if (malformed) {
      await page.reload();
      await expect(page.getByRole('button', { name: 'Reintentar carga' })).toBeVisible();
    } else {
      await readyAfterReload(page);
      await expect(page.locator('.workspace .footer-tag')).toHaveText(['Exclusivo', 'Exclusivo']);
    }
    expect(await page.evaluate(() => window.faults.writes)).toBe(0);
  }
});

test('long footer tags wrap inside the page on desktop and mobile', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await showSection(page, 'Diseño');
    const value = 'ColecciónEspecial'.repeat(12);
    await page.getByRole('textbox', { name: 'Etiqueta del pie', exact: true }).fill(value);
    if (width < 768) await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'Vista previa', exact: true }).click();
    await expect(page.locator('.workspace .footer-tag').first()).toBeVisible();
    const fits = await page.locator('.workspace .footer-tag').evaluateAll((tags) => tags.every((tag) => {
      const bounds = tag.getBoundingClientRect();
      const sheet = tag.closest('.page-a4')!.getBoundingClientRect();
      const contact = tag.previousElementSibling!.getBoundingClientRect();
      return bounds.right <= sheet.right && bounds.bottom <= sheet.bottom && bounds.left >= contact.right && tag.scrollWidth <= tag.clientWidth + 1;
    }));
    expect(fits).toBe(true);
  }
});

test('PDF and HTML render the custom footer tag and omit it when empty', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const execute = promisify(execFile);
  const inspector = testInfo.outputPath('inspect-pdf');
  await execute('swiftc', ['-module-cache-path', '/private/tmp/catalogmaker-swift-cache', 'tests/inspect-pdf.swift', '-o', inspector]);
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  for (const value of ['OFERTA ESPECIAL', '']) {
    await page.evaluate((value) => window.catalogTest.settings.getState().updateFooterTag(value), value);
    await expect(page.locator('.workspace .footer-tag')).toHaveCount(value ? 2 : 0);
    const prefix = testInfo.outputPath(value ? 'custom' : 'empty');
    await writeFile(`${prefix}.pdf`, Buffer.from(await page.evaluate(() => window.catalogTest.output('pdf')), 'base64'));
    const pdf = JSON.parse((await execute(inspector, [`${prefix}.pdf`])).stdout) as { pages: { footerText: string[] }[] };
    expect(pdf.pages).toHaveLength(2);
    const html = await page.evaluate(() => window.catalogTest.output('html'));
    await writeFile(`${prefix}.html`, html);
    const matches = [...html.matchAll(/class="pg" src="data:image\/jpeg;base64,([^"]+)"/g)];
    expect(matches).toHaveLength(2);
    const paths: string[] = [];
    for (const [index, match] of matches.entries()) {
      const path = `${prefix}-${index}.jpg`;
      await writeFile(path, Buffer.from(match[1], 'base64'));
      paths.push(path);
    }
    const images = JSON.parse((await execute(inspector, ['--images', ...paths])).stdout) as { footerText: string[] }[];
    for (const output of [...pdf.pages, ...images]) {
      const text = output.footerText.join(' ');
      if (value) expect(text).toContain(value);
      else expect(text).not.toContain('OFERTA ESPECIAL');
      expect(text).not.toMatch(/EXCLUSIVO/i);
    }
  }
});
