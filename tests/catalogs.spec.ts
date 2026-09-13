import { test, expect } from './fixtures';
import { readFile } from 'node:fs/promises';
import { openApp, readyAfterReload, saved, downloadPDF } from './helpers';

async function seedLegacy(page: import('@playwright/test').Page) {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(2);
    await h.products.getState().replaceImage(h.products.getState().products[0].id, await h.photo());
    await h.settings.getState().setBgImage(await h.photo('fondo.png', '#334455'));
    await h.settings.getState().setIndexBgImage(await h.photo('indice.png', '#775533'));
    const data = await h.dbLoadCatalog();
    const request = indexedDB.open('keyval-store');
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
    const tx = db.transaction('keyval', 'readwrite');
    const store = tx.objectStore('keyval');
    store.clear();
    store.put(data.products, 'cm:products');
    store.put(data.settings, 'cm:settings');
    for (const [id, blob] of data.images) store.put(blob, `cm:img:${id}`);
    store.put(data.background, 'cm:bg');
    store.put(data.indexBackground, 'cm:index-bg');
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); });
    db.close();
  });
}

test('migration preserves original records, verifies photos and runs only once', async ({ page }) => {
  await seedLegacy(page);
  await readyAfterReload(page);
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    const library = await h.dbReadLibrary();
    const data = await h.dbLoadCatalog();
    const request = indexedDB.open('keyval-store');
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
    const tx = db.transaction('keyval', 'readonly');
    const original = tx.objectStore('keyval').get('cm:products');
    const products = await new Promise<unknown>((resolve) => { original.onsuccess = () => resolve(original.result); });
    db.close();
    return { count: library.catalogs.length, phase: library.registry.migration, same: JSON.stringify(products) === JSON.stringify(data.products), photos: data.images.size, backgrounds: !!data.background && !!data.indexBackground, id: library.registry.mainId };
  });
  expect(result).toMatchObject({ count: 1, phase: 'ready', same: true, photos: 1, backgrounds: true });
  await readyAfterReload(page);
  expect(await page.evaluate(() => window.catalogTest.catalogs.getState().mainId)).toBe(result.id);
  expect(await page.evaluate(() => window.faults.writes)).toBe(0);
});

test('interrupted migration resumes the same candidate and preserves legacy records', async ({ page }) => {
  await seedLegacy(page);
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    let registryWrites = 0;
    IDBObjectStore.prototype.put = function (value, key) {
      if (key === 'cm:catalogs' && ++registryWrites === 2) throw new DOMException('Interrupted migration', 'QuotaExceededError');
      return put.call(this, value, key);
    };
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reintentar carga' })).toBeVisible();
  const pending = await page.evaluate(async () => {
    const h = (await import('/tests/browser-harness.ts')).harness;
    const library = await h.dbReadLibrary();
    return { id: library.registry.mainId, phase: library.registry.migration, count: library.catalogs.length };
  });
  expect(pending).toMatchObject({ phase: 'pending', count: 1 });
  await readyAfterReload(page);
  expect(await page.evaluate(() => window.catalogTest.catalogs.getState().activeId)).toBe(pending.id);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.length)).toBe(2);
});

test('simultaneous migration creates only one Principal', async ({ page, context }) => {
  await seedLegacy(page);
  const second = await context.newPage();
  await Promise.all([readyAfterReload(page), openApp(second)]);
  const first = await page.evaluate(() => window.catalogTest.catalogs.getState().activeId);
  expect(await second.evaluate(() => window.catalogTest.catalogs.getState().activeId)).toBe(first);
  expect(await page.evaluate(async () => (await window.catalogTest.dbReadLibrary()).catalogs.length)).toBe(1);
});

test('copies preserve every domain and remain independent through resets, deletion and recovery', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(4);
    await h.products.getState().replaceImage(h.products.getState().products[0].id, await h.photo());
    await h.products.getState().setImagePosition(h.products.getState().products[0].id, 75);
    await h.products.getState().moveProduct(h.products.getState().products[0].id, 'down');
    await h.settings.getState().setBgImage(await h.photo('bg.png'));
    await h.settings.getState().setIndexBgImage(await h.photo('idx.png', '#0000ee'));
    await h.settings.getState().setPageItemCount(0, 2);
    await h.settings.getState().setPageLayout(0, 'duo-rows');
    await h.settings.getState().updateStoreName('Mi negocio');
    const source = h.catalogs.getState().activeId;
    const original = await h.dbLoadCatalog(source);
    const copied = await h.createCatalog('Experimento', source);
    const copy = h.catalogs.getState().activeId;
    const data = await h.dbLoadCatalog(copy);
    const bytes = async (blob: Blob | null | undefined) => blob ? Array.from(new Uint8Array(await blob.arrayBuffer())) : null;
    const same = JSON.stringify(original.products) === JSON.stringify(data.products) && JSON.stringify(original.settings) === JSON.stringify(data.settings)
      && JSON.stringify(await bytes(original.background)) === JSON.stringify(await bytes(data.background))
      && JSON.stringify(await bytes(original.indexBackground)) === JSON.stringify(await bytes(data.indexBackground))
      && JSON.stringify(await bytes(original.images.values().next().value)) === JSON.stringify(await bytes(data.images.values().next().value));
    await h.manageCatalog('everything');
    const unchanged = await h.dbLoadCatalog(source);
    await h.changeCatalog(copy, 'delete');
    const fallback = h.catalogs.getState().activeId;
    await h.changeCatalog(copy, 'restore');
    await h.openCatalog(copy);
    return { copied: copied.status, source, copy, same, fallback, originalCount: unchanged.products.length, restoredCount: h.products.getState().products.length };
  });
  expect(result).toMatchObject({ copied: 'saved', same: true, originalCount: 4, restoredCount: 0 });
  expect(result.copy).not.toBe(result.source);
  expect(result.fallback).toBe(result.source);
  await readyAfterReload(page);
  expect(await page.evaluate(() => window.catalogTest.catalogs.getState().activeId)).toBe(result.copy);
});

test('names and Principal protection are enforced by actions and blank catalogs use defaults', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    const main = h.catalogs.getState().mainId;
    const deleted = await h.changeCatalog(main, 'delete');
    await h.settings.getState().updateStoreName('Marca personalizada');
    await h.changeCatalog(main, 'rename', 'Mi principal');
    const duplicateName = await h.createCatalog(' mi PRINCIPAL ');
    const emptyName = await h.createCatalog('  ');
    await h.createCatalog('En blanco');
    const blank = h.catalogs.getState().activeId;
    const brand = h.settings.getState().storeName;
    await h.changeCatalog(blank, 'delete');
    await h.changeCatalog(blank, 'purge');
    const library = await h.dbReadLibrary();
    let missing = false;
    try { await h.dbLoadCatalogRecord(blank, true); } catch { missing = true; }
    return { deleted: deleted.status, duplicateName: duplicateName.status, emptyName: emptyName.status, defaultBrand: brand === h.DEFAULT_STATE.storeName, count: library.catalogs.length, main: library.registry.mainId, sameMain: main === library.registry.mainId, missing };
  });
  expect(result).toMatchObject({ deleted: 'failed', duplicateName: 'failed', emptyName: 'failed', defaultBrand: true, count: 1, sameMain: true, missing: true });
});

for (const failure of ['quota', 'abort'] as const) {
  test(`failed creation with ${failure} leaves source, selection and image ownership intact`, async ({ page }) => {
    await openApp(page);
    const result = await page.evaluate(async (failure) => {
      const h = window.catalogTest;
      await h.products.getState().addProducts([await h.photo()]);
      const id = h.catalogs.getState().activeId;
      const url = h.products.getState().products[0].image;
      window.faults.failure = failure;
      window.faults.failKey = 'cm:catalog-meta:';
      const result = await h.createCatalog('Fallida', id);
      const library = await h.dbReadLibrary();
      return { result: result.status, same: id === h.catalogs.getState().activeId && id === library.registry.lastActiveId, catalogs: library.catalogs.length, retained: !window.faults.revoked.includes(url), leaked: window.faults.created.filter((image) => image !== url && !window.faults.revoked.includes(image)).length };
    }, failure);
    expect(result).toEqual({ result: 'failed', same: true, catalogs: 1, retained: true, leaked: 0 });
  });
}

test('switch waits for pending writes, keeps failed drafts and respects export leases', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(1);
    const main = h.catalogs.getState().mainId;
    await h.createCatalog('Otro');
    const other = h.catalogs.getState().activeId;
    await h.openCatalog(main);
    window.faults.delay = 60;
    const id = h.products.getState().products[0].id;
    const writing = h.products.getState().updateField(id, 'name', 'ANTES DE CAMBIAR');
    const switching = h.openCatalog(other);
    const blocked = await h.products.getState().addBlankProduct();
    await Promise.all([writing, switching]);
    const persisted = (await h.dbLoadCatalog(main)).products[0].name;
    window.faults.delay = 0;
    await h.openCatalog(main);
    window.faults.failKey = 'cm:products';
    await h.products.getState().updateField(id, 'name', 'BORRADOR');
    const failedSwitch = await h.openCatalog(other);
    const same = h.catalogs.getState().activeId === main;
    await h.retrySave();
    const release = h.acquireExport()!;
    const duringExport = await h.openCatalog(other);
    release();
    return { blocked: blocked.status, persisted, failedSwitch: failedSwitch.status, same, duringExport: duringExport.status, draft: h.products.getState().products[0].name };
  });
  expect(result).toEqual({ blocked: 'ignored', persisted: 'ANTES DE CAMBIAR', failedSwitch: 'failed', same: true, duringExport: 'ignored', draft: 'BORRADOR' });
});

test('invalid price blocks switching; valid price is committed before the switch', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => { const h = window.catalogTest; await h.fixture(1); await h.createCatalog('Otro'); await h.openCatalog(h.catalogs.getState().mainId); });
  await expect(page.getByRole('complementary', { name: 'Herramientas del catálogo' })).toHaveCount(1);
  await expect(page.getByRole('main', { name: 'Vista previa del catálogo' })).toHaveCount(1);
  await page.locator('.rs-input-price input').fill('precio inválido');
  await page.getByRole('button', { name: /^Mis catálogos:/ }).click();
  await page.getByRole('listitem', { name: 'Catálogo Otro', exact: true }).getByRole('button', { name: 'Abrir', exact: true }).click();
  await expect(page.getByText('Corregí el precio en edición antes de cambiar de catálogo.')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.locator('.rs-input-price input').fill('6543');
  await page.getByRole('button', { name: /^Mis catálogos:/ }).click();
  await page.getByRole('listitem', { name: 'Catálogo Otro', exact: true }).getByRole('button', { name: 'Abrir', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mis catálogos: Otro', exact: true })).toBeVisible();
  expect(await page.evaluate(async () => (await window.catalogTest.dbLoadCatalog(window.catalogTest.catalogs.getState().mainId)).products[0].price)).toBe('$ 6.543');
});

test('two tabs reject stale writes and preserve the newest draft as an independent copy', async ({ page, context }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  const second = await context.newPage();
  await openApp(second);
  await second.evaluate(() => {
    const h = window.catalogTest;
    window.faults.failKey = 'cm:products';
    return h.products.getState().updateField(h.products.getState().products[0].id, 'name', 'BORRADOR SEGUNDA');
  });
  await page.evaluate(() => { const h = window.catalogTest; return h.products.getState().updateField(h.products.getState().products[0].id, 'name', 'GUARDADO PRIMERA'); });
  await second.evaluate(() => window.catalogTest.refreshCatalogs());
  await expect(second.getByRole('button', { name: 'Conservar mis cambios como copia' })).toBeVisible();
  await second.getByRole('button', { name: 'Conservar mis cambios como copia' }).click();
  await saved(second);
  const result = await second.evaluate(async () => {
    const h = window.catalogTest;
    return { independent: h.catalogs.getState().activeId !== h.catalogs.getState().mainId, draft: h.products.getState().products[0].name, main: (await h.dbLoadCatalog(h.catalogs.getState().mainId)).products[0].name };
  });
  expect(result).toEqual({ independent: true, draft: 'BORRADOR SEGUNDA', main: 'GUARDADO PRIMERA' });
});

test('different tabs keep independent selection and a deleted catalog cannot be resurrected by stale writes', async ({ page, context }) => {
  await openApp(page);
  await page.evaluate(async () => { const h = window.catalogTest; await h.fixture(1); await h.createCatalog('Segundo', h.catalogs.getState().mainId); });
  const secondaryId = await page.evaluate(() => window.catalogTest.catalogs.getState().activeId);
  const second = await context.newPage();
  await openApp(second);
  await page.evaluate(() => { const h = window.catalogTest; return h.openCatalog(h.catalogs.getState().mainId); });
  expect(await second.evaluate(() => window.catalogTest.catalogs.getState().activeId)).toBe(secondaryId);
  await page.evaluate((id) => window.catalogTest.changeCatalog(id, 'delete'), secondaryId);
  await second.evaluate(() => window.catalogTest.refreshCatalogs());
  const result = await second.evaluate(() => { const h = window.catalogTest; return h.products.getState().updateField(h.products.getState().products[0].id, 'name', 'OBSOLETO'); });
  expect(result.status).toBe('ignored');
  await second.getByRole('button', { name: 'Cargar versión guardada' }).click();
  await saved(second);
  expect(await second.evaluate(() => window.catalogTest.catalogs.getState().activeId === window.catalogTest.catalogs.getState().mainId)).toBe(true);
});

for (const width of [390, 1440]) {
  test(`catalog manager works at ${width}px and limits publishing to Principal`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openApp(page);
    await page.evaluate(() => window.catalogTest.fixture(1));
    await page.getByRole('button', { name: /^Mis catálogos:/ }).click();
    await page.getByRole('button', { name: 'Hacer una copia', exact: true }).click();
    await page.getByLabel('Nombre del catálogo', { exact: true }).fill('Experimento');
    await page.getByRole('button', { name: 'Guardar catálogo', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Mis catálogos: Experimento', exact: true })).toBeVisible();
    if (width < 1024) {
      await page.getByRole('button', { name: 'Exportar catálogo', exact: true }).click();
      await expect(page.getByRole('menuitem', { name: 'Publicar en Web', exact: true })).toHaveAttribute('data-disabled');
      await page.keyboard.press('Escape');
    } else await expect(page.getByRole('button', { name: 'Publicar en Web', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: /^Mis catálogos:/ }).click();
    expect(await page.getByRole('dialog').evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /^Mis catálogos:/ })).toBeFocused();
  });
}

test('repeated UI switching keeps exactly one sidebar and resets the editor without reloading', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error' && message.text().includes('same key')) errors.push(message.text()); });
  await openApp(page);
  await page.evaluate(async () => { const h = window.catalogTest; await h.fixture(13); await h.createCatalog('Vacío'); });
  for (const name of ['Principal', 'Vacío', 'Principal', 'Vacío', 'Principal']) {
    await page.getByRole('button', { name: /^Mis catálogos:/ }).click();
    await page.getByRole('listitem', { name: `Catálogo ${name}`, exact: true }).getByRole('button', { name: 'Abrir', exact: true }).click();
    await expect(page.getByRole('button', { name: `Mis catálogos: ${name}`, exact: true })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Herramientas del catálogo' })).toHaveCount(1);
    await expect(page.getByRole('main', { name: 'Vista previa del catálogo' })).toHaveCount(1);
    await expect(page.locator('.rs-card')).toHaveCount(name === 'Principal' ? 13 : 0);
    await expect(page.locator('.page-a4')).toHaveCount(name === 'Principal' ? 6 : 0);
  }
  expect(errors).toEqual([]);
});

test('PDF after switching uses the active catalog name and only its pages', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(13);
    await h.createCatalog('Temporada');
    await h.fixture(2);
  });
  await expect(page.locator('.page-a4')).toHaveCount(2);
  const pending = page.waitForEvent('download');
  await downloadPDF(page);
  const download = await pending;
  expect(download.suggestedFilename()).toContain('temporada');
  const pdf = await readFile((await download.path())!);
  expect(pdf.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(2);
});

test('transaction revision check rejects simultaneous edits even without change notifications', async ({ page, context }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'BroadcastChannel', { value: undefined }); });
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  const second = await context.newPage();
  await second.addInitScript(() => { Object.defineProperty(window, 'BroadcastChannel', { value: undefined }); });
  await openApp(second);
  const results = await Promise.all([page, second].map((tab, index) => tab.evaluate((index) => {
    const h = window.catalogTest;
    return h.products.getState().updateField(h.products.getState().products[0].id, 'name', `PESTAÑA ${index}`);
  }, index)));
  expect(results.map((result) => result.status).sort()).toEqual(['conflict', 'saved']);
  const winner = results.findIndex((result) => result.status === 'saved');
  expect(await page.evaluate(async () => (await window.catalogTest.dbLoadCatalog()).products[0].name)).toBe(`PESTAÑA ${winner}`);
});

test('failed opening keeps source selection and releases only newly allocated URLs', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.products.getState().addProducts([await h.photo('first.png'), await h.photo('second.png')]);
    const main = h.catalogs.getState().mainId;
    await h.createCatalog('Destino', main);
    const destination = h.catalogs.getState().activeId;
    await h.openCatalog(main);
    const original = h.products.getState().products.map((p) => p.image);
    const create = URL.createObjectURL;
    let count = 0;
    URL.createObjectURL = (blob) => { if (++count === 2) throw new Error('Cannot allocate image'); return create(blob); };
    const failed = await h.openCatalog(destination);
    URL.createObjectURL = create;
    const library = await h.dbReadLibrary();
    return { failed: failed.status, current: h.catalogs.getState().activeId === main, selected: library.registry.lastActiveId === main, retained: original.every((url) => !window.faults.revoked.includes(url)), leaked: window.faults.created.filter((url) => !original.includes(url) && !window.faults.revoked.includes(url)).length };
  });
  expect(result).toEqual({ failed: 'failed', current: true, selected: true, retained: true, leaked: 0 });
});

test('deletion confirmations identify the catalog, allow cancellation and support recovery then permanent deletion', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => { const h = window.catalogTest; await h.fixture(1); await h.createCatalog('Eliminar esta copia', h.catalogs.getState().mainId); await h.openCatalog(h.catalogs.getState().mainId); });
  await page.getByRole('button', { name: /^Mis catálogos:/ }).click();
  const row = page.getByRole('listitem', { name: 'Catálogo Eliminar esta copia', exact: true });
  await row.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Eliminar esta copia');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.locator('.catalog-trash summary').click();
  const removed = page.getByRole('listitem', { name: 'Catálogo eliminado Eliminar esta copia', exact: true });
  await removed.getByRole('button', { name: 'Recuperar', exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await removed.getByRole('button', { name: 'Borrar definitivamente', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('archivo de respaldo');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(removed).toHaveCount(0);
  expect(await page.evaluate(async () => (await window.catalogTest.dbReadLibrary()).catalogs.length)).toBe(1);
});
