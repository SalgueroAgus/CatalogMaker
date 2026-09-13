import { test, expect } from './fixtures';
import { openApp, readyAfterReload, saved } from './helpers';
import * as XLSX from 'xlsx';

for (const action of ['add', 'import', 'replace', 'delete', 'reset'] as const) {
  test(`failed ${action} keeps durable image and releases obsolete resources after retry`, async ({ page }) => {
    await openApp(page);
    const result = await page.evaluate(async (action) => {
      const h = window.catalogTest;
      await h.products.getState().addProducts([await h.photo('FIRST.png')]);
      const original = h.products.getState().products[0];
      const before = await h.dbLoadCatalog();
      const incoming = await h.photo('SECOND.png', '#3366bb');
      window.faults.failKey = 'cm:img:';
      const mutation = action === 'add' ? h.products.getState().addProducts([incoming])
        : action === 'import' ? h.products.getState().importProducts([{ name: 'SECOND', price: '100', description: 'D' }], [incoming])
        : action === 'replace' ? h.products.getState().replaceImage(original.id, incoming)
        : action === 'delete' ? h.products.getState().deleteProduct(original.id)
        : h.manageCatalog('everything');
      const failure = await mutation;
      const afterFailure = await h.dbLoadCatalog();
      const oldRetained = !window.faults.revoked.includes(original.image);
      const draft = h.products.getState().products.map((product) => product.image);
      const decode = async (url: string) => { const image = new Image(); image.src = url; await image.decode(); };
      await Promise.all(draft.map(decode));
      await h.retrySave();
      const afterRetry = await h.dbLoadCatalog();
      const active = new Set(h.products.getState().products.map((product) => product.image));
      const obsolete = window.faults.created.filter((url) => !active.has(url));
      return { failure: failure.status, unchanged: JSON.stringify(before.products) === JSON.stringify(afterFailure.products) && afterFailure.images.size === before.images.size, oldRetained, durableCount: afterRetry.products.length, photoCount: afterRetry.images.size, allObsoleteReleased: obsolete.every((url) => window.faults.revoked.includes(url)), activeRetained: [...active].every((url) => !window.faults.revoked.includes(url)) };
    }, action);
    expect(result).toMatchObject({ failure: 'failed', unchanged: true, oldRetained: true, allObsoleteReleased: true, activeRetained: true });
    expect(result.durableCount).toBe(action === 'add' || action === 'import' ? 2 : action === 'replace' ? 1 : 0);
    expect(result.photoCount).toBe(result.durableCount);
    await saved(page);
    await readyAfterReload(page);
    expect(await page.evaluate(() => window.catalogTest.products.getState().products.length)).toBe(result.durableCount);
  });
}

test('real Excel over-limit import retains correction rows and appends once after correction', async ({ page }) => {
  await openApp(page);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Nombre', 'Descripción', 'Precio'], ['EXCEL', 'x'.repeat(501), '100']]));
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  await page.locator('input[accept=".xlsx,.xls"]').setInputFiles({ name: 'rows.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer });
  await page.getByRole('button', { name: 'Importar 1 artículo', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'supera 500' })).toBeVisible();
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.length)).toBe(0);
  const correction = page.getByLabel('Corregir descripción, fila 2: EXCEL');
  await correction.fill('CORREGIDO');
  await expect(correction).toBeVisible();
  await expect(correction).toBeFocused();
  await expect(correction).toHaveAttribute('aria-invalid', 'false');
  await page.getByRole('button', { name: 'Importar 1 artículo', exact: true }).click();
  await expect(page.locator('.rs-input-name textarea')).toHaveValue('EXCEL');
  await saved(page);
  await readyAfterReload(page);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.map((p) => p.description))).toEqual(['CORREGIDO']);
});

test('invalid stored data is preserved; partial failed hydration allocates no URLs', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const open = indexedDB.open('keyval-store');
    const db = await new Promise<IDBDatabase>((resolve) => { open.onsuccess = () => resolve(open.result); });
    const tx = db.transaction('keyval', 'readwrite');
    const store = tx.objectStore('keyval');
    store.clear();
    store.put([{ id: 'valid-legacy-id', name: 'LEGACY', price: '$9', description: 'l'.repeat(600), bgColor: '#fff' }], 'cm:products');
    store.put('invalid blob', 'cm:img:valid-legacy-id');
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
    db.close();
  });
  await page.reload();
  await page.evaluate(async () => {
    const path = '/tests/browser-harness.ts';
    window.catalogTest = (await import(path)).harness;
  });
  await expect(page.getByRole('button', { name: 'Reintentar carga' })).toBeVisible();
  expect(await page.evaluate(() => window.faults.created)).toEqual([]);
  expect(await page.evaluate(() => window.faults.writes)).toBe(0);
  await page.evaluate(async () => {
    const open = indexedDB.open('keyval-store');
    const db = await new Promise<IDBDatabase>((resolve) => { open.onsuccess = () => resolve(open.result); });
    const tx = db.transaction('keyval', 'readwrite');
    tx.objectStore('keyval').delete('cm:img:valid-legacy-id');
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
    db.close();
  });
  await page.getByRole('button', { name: 'Reintentar carga' }).click();
  await expect(page.locator('.rs-input-name textarea')).toHaveValue('LEGACY');
  await page.getByRole('button', { name: 'Detalles', exact: true }).click();
  await expect(page.locator('.rs-desc-textarea textarea')).toHaveValue('l'.repeat(600));
  await expect(page.locator('.rs-desc-textarea textarea')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('.rs-desc-textarea textarea').fill('CORREGIDO');
  await saved(page);
  await readyAfterReload(page);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products[0].id)).toBe('valid-legacy-id');
});
