import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from './fixtures';
import { openApp, readyAfterReload } from './helpers';

async function prepareBackup(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(3);
    await h.products.getState().replaceImage(h.products.getState().products[0].id, await h.photo());
    await h.settings.getState().setBgImage(await h.photo('fondo.png', '#abcdef'));
    await h.settings.getState().setIndexBgImage(await h.photo('indice.png', '#fedcba'));
    await h.settings.getState().setPageItemCount(0, 2);
    await h.settings.getState().setPageLayout(0, 'duo-rows');
    await h.settings.getState().updateFooterTagUrl('https://example.com/contacto');
    const captured = h.captureCatalogBackup()!;
    try { return await (await h.buildCatalogBackup(captured.record)).text(); } finally { captured.release(); }
  });
}

test('full backup restores in a separate browser profile with identical data and original image bytes', async ({ page, playwright, browserName, launchOptions, baseURL }) => {
  await openApp(page);
  const backup = await prepareBackup(page);
  const profile = await mkdtemp(join(tmpdir(), 'catalogmaker-backup-'));
  const target = await playwright[browserName].launchPersistentContext(profile, { ...launchOptions, headless: true, baseURL });
  try {
    const destination = target.pages()[0] ?? await target.newPage();
    await openApp(destination);
    const result = await destination.evaluate(async (text) => {
      const h = window.catalogTest;
      const parsed = await h.parseCatalogBackup(new Blob([text], { type: 'application/json' }));
      const result = await h.restoreBackup('Restaurado', parsed.data);
      const id = h.catalogs.getState().activeId;
      const captured = h.captureCatalogBackup()!;
      let restored: string;
      try { restored = await (await h.buildCatalogBackup(captured.record)).text(); } finally { captured.release(); }
      const first = JSON.parse(text);
      const second = JSON.parse(restored);
      const payload = (value: typeof first) => JSON.stringify({ products: value.products, settings: value.settings, images: value.images, background: value.background, indexBackground: value.indexBackground });
      return { status: result.status, same: payload(first) === payload(second), secondary: id !== h.catalogs.getState().mainId, count: h.catalogs.getState().catalogs.length, urlsInFile: restored.includes('blob:') };
    }, backup);
    expect(result).toEqual({ status: 'saved', same: true, secondary: true, count: 2, urlsInFile: false });
    await readyAfterReload(destination);
    expect(await destination.evaluate(() => window.catalogTest.products.getState().products.length)).toBe(3);
  } finally { await target.close(); await rm(profile, { recursive: true, force: true }); }
});

for (const corruption of ['json', 'version', 'duplicate', 'orphan', 'image', 'settings', 'count', 'layout'] as const) {
  test(`rejects ${corruption} corruption without changing catalogs or leaking image URLs`, async ({ page }) => {
    await openApp(page);
    const backup = await prepareBackup(page);
    const result = await page.evaluate(async ({ backup, corruption }) => {
      const h = window.catalogTest;
      const invalid = JSON.parse(backup);
      if (corruption === 'version') invalid.version = 999;
      if (corruption === 'duplicate') { invalid.products.push(invalid.products[0]); invalid.catalog.productCount++; }
      if (corruption === 'orphan') invalid.images[0].id = 'missing-product';
      if (corruption === 'image') invalid.background.base64 = 'YWJj';
      if (corruption === 'settings') invalid.settings.itemsPerPage = 99;
      if (corruption === 'count') invalid.catalog.productCount = 999;
      if (corruption === 'layout') invalid.settings.pageLayouts = { 0: 'invalid' };
      const before = window.faults.writes;
      const created = window.faults.created.length;
      let rejected = false;
      try { await h.parseCatalogBackup(new Blob([corruption === 'json' ? '{bad' : JSON.stringify(invalid)])); } catch { rejected = true; }
      return { rejected, writes: window.faults.writes - before, count: h.catalogs.getState().catalogs.length, leaked: window.faults.created.slice(created).filter((url) => !window.faults.revoked.includes(url)).length };
    }, { backup, corruption });
    expect(result).toEqual({ rejected: true, writes: 0, count: 1, leaked: 0 });
  });
}

test('failed restore keeps the active catalog intact and can be retried', async ({ page }) => {
  await openApp(page);
  const backup = await prepareBackup(page);
  const result = await page.evaluate(async (text) => {
    const h = window.catalogTest;
    const id = h.catalogs.getState().activeId;
    const parsed = await h.parseCatalogBackup(new Blob([text]));
    window.faults.failKey = 'cm:img:';
    const failed = await h.restoreBackup('Restaurado', parsed.data);
    const unchanged = h.catalogs.getState().activeId === id && (await h.dbReadLibrary()).catalogs.length === 1;
    const retried = await h.restoreBackup('Restaurado', parsed.data);
    return { failed: failed.status, unchanged, retried: retried.status, count: h.catalogs.getState().catalogs.length };
  }, backup);
  expect(result).toEqual({ failed: 'failed', unchanged: true, retried: 'saved', count: 2 });
});

test('backup contains unsaved draft and preserves readable legacy descriptions', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(1);
    const product = h.products.getState().products[0];
    h.products.getState().hydrateProducts([{ ...product, description: 'L'.repeat(600) }]);
    window.faults.failKey = 'cm:products';
    await h.products.getState().updateField(product.id, 'name', 'SIN GUARDAR');
    const captured = h.captureCatalogBackup()!;
    try {
      const text = await (await h.buildCatalogBackup(captured.record)).text();
      const parsed = await h.parseCatalogBackup(new Blob([text]));
      return { draft: captured.draft, name: parsed.data.products[0].name, description: parsed.data.products[0].description.length, durable: (await h.dbLoadCatalog()).products[0].name, independentName: JSON.parse(text).catalog.name };
    } finally { captured.release(); }
  });
  expect(result).toEqual({ draft: true, name: 'SIN GUARDAR', description: 600, durable: 'PRODUCTO 001', independentName: 'Principal' });
});

test('UI downloads a backup and previews restoration before creating another catalog', async ({ page }) => {
  await openApp(page);
  await prepareBackup(page);
  await page.getByRole('button', { name: /^Mis catálogos:/ }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar respaldo del actual', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('principal.catalogmaker.json');
  const path = await file.path();
  await page.locator('input[accept=".catalogmaker.json,application/json"]').setInputFiles(path!);
  await expect(page.getByText('Respaldo «Principal»: 3 productos. Se creará un catálogo independiente.')).toBeVisible();
  expect(await page.evaluate(() => window.catalogTest.catalogs.getState().catalogs.length)).toBe(1);
  await page.getByLabel('Nombre del catálogo', { exact: true }).fill('Desde archivo');
  await page.getByRole('button', { name: 'Guardar catálogo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mis catálogos: Desde archivo', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.catalogTest.catalogs.getState().catalogs.length)).toBe(2);
});
