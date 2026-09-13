import { test, expect } from './fixtures';
import { openApp, readyAfterReload, saved, showSection } from './helpers';

test('fixed clock mixed intake creates unique identities and invalid mutations do not write or allocate', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    Date.now = () => 123456789;
    const photo = await h.photo();
    const operations = Array.from({ length: 12 }, (_, i) => i % 3 === 0 ? h.products.getState().addBlankProduct() : i % 3 === 1 ? h.products.getState().addProducts([photo]) : h.products.getState().importProducts([{ name: 'IMPORT', price: 'SIN FORMATO', description: '' }], [photo]));
    await Promise.all(operations);
    const products = h.products.getState().products;
    const before = JSON.stringify(products);
    const writes = window.faults.writes;
    const created = window.faults.created.length;
    const first = products[0].id;
    const last = products.at(-1)!.id;
    await h.products.getState().moveProduct('missing', 'down');
    await h.products.getState().moveProduct('missing', 'up');
    await h.products.getState().moveProduct(first, 'up');
    await h.products.getState().moveProduct(last, 'down');
    await h.products.getState().reorderProduct('missing', first, true);
    await h.products.getState().reorderProduct(first, 'missing', false);
    await h.products.getState().reorderProduct(first, first, true);
    await h.products.getState().replaceImage('missing', photo);
    await h.products.getState().deleteProduct('missing');
    await h.products.getState().updateField('missing', 'name', 'invalid');
    return { count: products.length, unique: new Set(products.map((p) => p.id)).size, unchanged: before === JSON.stringify(h.products.getState().products), extraWrites: window.faults.writes - writes, extraURLs: window.faults.created.length - created };
  });
  expect(result).toEqual({ count: 12, unique: 12, unchanged: true, extraWrites: 0, extraURLs: 0 });
});

test('central limits reject import before append, preserve stored text and allow arbitrary name/price', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    const invalid = await h.products.getState().importProducts([{ name: 'NAME', price: 'price', description: 'x'.repeat(501) }], [await h.photo('NAME.png')]);
    const count = h.products.getState().products.length;
    const allocations = window.faults.created.length;
    await h.products.getState().importProducts([{ name: 'n'.repeat(1000), price: 'p'.repeat(1000), description: 'd'.repeat(500) }], []);
    const id = h.products.getState().products[0].id;
    const edit = await h.products.getState().updateField(id, 'description', 'z'.repeat(501));
    return { invalid: invalid.status, count, allocations, edit: edit.status, length: h.products.getState().products[0].description.length };
  });
  expect(result).toEqual({ invalid: 'invalid', count: 0, allocations: 0, edit: 'invalid', length: 500 });
  await saved(page);
  await readyAfterReload(page);
  await expect(page.locator('.rs-input-name textarea')).toHaveValue('n'.repeat(1000));
  await expect(page.locator('.rs-input-price input')).toHaveValue('p'.repeat(1000));
  await page.getByRole('button', { name: 'Detalles', exact: true }).click();
  await expect(page.locator('.rs-desc-textarea textarea')).toHaveAttribute('maxlength', '500');
  await expect(page.locator('.cell-desc')).toHaveAttribute('maxlength', '500');
  await page.locator('.rs-desc-textarea textarea').fill('LISTA');
  await expect(page.locator('.cell-desc')).toHaveValue('LISTA');
  await page.locator('.cell-desc').fill('VISTA');
  await expect(page.locator('.rs-desc-textarea textarea')).toHaveValue('VISTA');
});

test('keyboard moves keep focus and persist order across list, index and preview', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(3));
  await expect(page.locator('[data-move="up"]').first()).toBeDisabled();
  await expect(page.locator('[data-move="down"]').last()).toBeDisabled();
  const middle = page.locator('.rs-card').nth(1);
  const id = await middle.getAttribute('data-id');
  await middle.getByRole('button', { name: 'Detalles', exact: true }).click();
  await middle.getByRole('button', { name: 'Subir', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.rs-card').first()).toHaveAttribute('data-id', id!);
  await expect(page.locator('.rs-card').first().getByRole('button', { name: 'Bajar', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator('.rs-card').last()).toHaveAttribute('data-id', id!);
  await saved(page);
  await readyAfterReload(page);
  const names = await page.locator('.rs-input-name textarea').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
  expect(await page.locator('.cell-name').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))).toEqual(names);
  expect(await page.locator('.idx-name').allTextContents()).toEqual(names);
  await page.evaluate(() => window.catalogTest.fixture(1));
  await page.getByRole('button', { name: 'Detalles', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Subir', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Bajar', exact: true })).toBeDisabled();
});

for (const count of [0, 1, 30, 31, 60, 61]) {
  for (const perPage of [1, 2, 3, 4, 5]) {
    test(`pagination ${count} products at ${perPage} per page agrees everywhere`, async ({ page }) => {
      await openApp(page);
      await page.evaluate(({ count, perPage }) => window.catalogTest.fixture(count, perPage), { count, perPage });
      const indexes = Math.ceil(count / 30);
      const total = indexes + Math.ceil(count / perPage);
      await expect(page.locator('.workspace .page-a4')).toHaveCount(total);
      expect(await page.locator('.page-num').allTextContents()).toEqual(Array.from({ length: total }, (_, i) => `Pág. ${String(i + 1).padStart(2, '0')}`));
      expect(await page.locator('.idx-page').allTextContents()).toEqual(Array.from({ length: count }, (_, i) => String(Math.floor(i / perPage) + indexes + 1).padStart(2, '0')));
      const separators = await page.locator('.rs-page-sep').allTextContents();
      expect(separators.map((text) => text.trim())).toEqual(Array.from({ length: Math.ceil(count / perPage) }, (_, i) => `Página ${i + indexes + 1}`));
      await showSection(page, 'Páginas');
      expect(await page.locator('.paginas-page-label').allTextContents()).toEqual(Array.from({ length: Math.ceil(count / perPage) }, (_, i) => `Página ${i + indexes + 1}`));
      if (!count) await expect(page.getByRole('button', { name: 'Descargar PDF', exact: true })).toBeDisabled();
    });
  }
}

test('every supported shape and partial occupancy resolves incompatible stored layouts', async ({ page }) => {
  await openApp(page);
  const checks = await page.evaluate(async () => {
    const h = window.catalogTest;
    const path = '/src/types/index.ts';
    const { SHAPE_ITEM_COUNT } = await import(path);
    const rows: { shape: string; expected: string; actual: string }[] = [];
    for (const [shape, count] of Object.entries(SHAPE_ITEM_COUNT) as [string, number][]) {
      await h.fixture(count, count);
      await h.settings.getState().setPageLayout(0, shape as Parameters<ReturnType<typeof h.settings.getState>['setPageLayout']>[1]);
      await new Promise(requestAnimationFrame);
      rows.push({ shape, expected: `product-grid grid-${shape}`, actual: document.querySelector('.product-grid')!.className });
    }
    for (let capacity = 1; capacity <= 5; capacity++) {
      for (let occupancy = 1; occupancy <= capacity; occupancy++) {
        await h.fixture(capacity + occupancy, capacity);
        await h.settings.getState().setPageLayout(1, 'quint-left');
        await new Promise(requestAnimationFrame);
        const grid = document.querySelectorAll('.product-grid')[1];
        rows.push({ shape: `${capacity}/${occupancy}`, expected: String(occupancy), actual: String(grid.children.length) });
        const shapeCount = SHAPE_ITEM_COUNT[grid.className.replace('product-grid grid-', '')];
        if (shapeCount !== occupancy) throw new Error(`Wrong fallback for ${capacity}/${occupancy}`);
      }
    }
    return rows;
  });
  expect(checks.every((row) => row.expected === row.actual)).toBe(true);
});

test('desktop pointer dragging preserves order after reload', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(3));
  await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
  const source = page.locator('.reorder-card').nth(1);
  const sourceId = await source.getAttribute('data-reorder-id');
  const grip = await source.locator('.reorder-grip').boundingBox();
  const destination = await page.locator('.reorder-card').first().boundingBox();
  await page.mouse.move(grip!.x + 22, grip!.y + 22);
  await page.mouse.down();
  await page.mouse.move(destination!.x + 12, destination!.y + 80, { steps: 10 });
  await expect(page.locator('.reorder-before')).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator('.reorder-card').first()).toHaveAttribute('data-reorder-id', sourceId!);
  await page.getByRole('button', { name: 'Volver al editor', exact: true }).click();
  await saved(page);
  await readyAfterReload(page);
  await expect(page.locator('.rs-card').first()).toHaveAttribute('data-id', sourceId!);
});
