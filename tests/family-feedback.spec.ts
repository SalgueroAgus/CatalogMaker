import { test, expect } from './fixtures';
import { openApp, readyAfterReload, saved } from './helpers';

test('description height follows typography and layout changes without editing its text', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(2, 2);
    await h.products.getState().updateField(h.products.getState().products[0].id, 'description', 'Descripción para comprobar el ajuste automático de líneas y el espacio disponible. '.repeat(4));
  });
  const description = page.locator('.cell-desc').first();
  const original = await description.inputValue();
  const small = await description.evaluate((element) => element.clientHeight);
  await page.evaluate(() => window.catalogTest.settings.getState().updateFontSize('body', 22));
  await expect.poll(() => description.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
  expect(await description.evaluate((element) => element.clientHeight)).toBeGreaterThan(small * 2);
  const narrow = await description.evaluate((element) => element.clientHeight);
  await page.evaluate(() => window.catalogTest.settings.getState().setPageLayout(0, 'duo-rows'));
  await expect.poll(() => description.evaluate((element) => element.clientHeight)).toBeLessThan(narrow);
  await expect.poll(() => description.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
  const wide = await description.evaluate((element) => element.clientHeight);
  await page.evaluate(() => window.catalogTest.settings.getState().setPageLayout(0, 'duo-cols'));
  await expect.poll(() => description.evaluate((element) => element.clientHeight)).toBeGreaterThan(wide);
  await page.evaluate(() => window.catalogTest.settings.getState().updateFontSize('body', 8));
  await expect.poll(() => description.evaluate((element) => element.clientHeight)).toBeLessThan(wide);
  await expect(description).toHaveValue(original);
  await saved(page);
  await readyAfterReload(page);
  await expect(description).toHaveValue(original);
  await expect.poll(() => description.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
});

test('background file selection preserves distinct product photos through replacement and reload', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(2);
    await h.products.getState().replaceImage(h.products.getState().products[0].id, await h.photo('product.png', '#d22135'));
  });
  const before = await page.evaluate(async () => {
    const h = window.catalogTest;
    const data = await h.dbLoadCatalog();
    return { products: data.products, images: await Promise.all([...data.images].map(async ([id, blob]) => [id, Array.from(new Uint8Array(await blob.arrayBuffer()))])) };
  });
  await page.getByRole('button', { name: 'Página', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Imagen', exact: true }).click();
  for (const color of ['#2060b0', '#17a13a']) {
    const background = await page.evaluate(async (color) => Array.from(new Uint8Array(await (await window.catalogTest.photo('background.png', color)).arrayBuffer())), color);
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /^(Cargar|Cambiar) imagen$/ }).click();
    await (await chooser).setFiles({ name: 'background.png', mimeType: 'image/png', buffer: Buffer.from(background) });
    await saved(page);
    await expect.poll(() => page.evaluate(() => window.catalogTest.settings.getState().bgImage !== null)).toBe(true);
  }
  await readyAfterReload(page);
  const after = await page.evaluate(async () => {
    const h = window.catalogTest;
    const data = await h.dbLoadCatalog();
    const background = h.settings.getState().bgImage;
    const photo = h.products.getState().products[0].image;
    const image = new Image(); image.src = photo; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0, 1, 1);
    return { products: data.products, images: await Promise.all([...data.images].map(async ([id, blob]) => [id, Array.from(new Uint8Array(await blob.arrayBuffer()))])), distinct: background !== photo, pixel: Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3) };
  });
  expect(after.products).toEqual(before.products);
  expect(after.images).toEqual(before.images);
  expect(after.distinct).toBe(true);
  expect(after.pixel).toEqual([210, 33, 53]);
});

for (const width of [390, 1000, 1440]) {
  test(`back to top reaches the beginning of each active panel at width ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openApp(page);
    await page.evaluate(() => window.catalogTest.fixture(9));
    const workspace = page.locator('.workspace');
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBeGreaterThan(200);
    const previewTop = page.getByRole('button', { name: 'Volver arriba en Vista Previa', exact: true });
    await expect(previewTop).toBeInViewport();
    const size = await previewTop.boundingBox();
    expect(size!.width).toBeGreaterThanOrEqual(44);
    expect(size!.height).toBeGreaterThanOrEqual(44);
    await previewTop.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(0);
    await expect(workspace).toBeFocused();
    await expect(previewTop).toBeHidden();
    await page.screenshot({ path: testInfo.outputPath('preview-at-top.png') });
    if (width < 768) await page.getByRole('button', { name: 'Productos', exact: true }).click();
    else if (width < 1200) await page.locator('.sidebar-right-toggle').click();
    const panel = page.getByRole('tabpanel', { name: /Artículos/ });
    await panel.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    const productsTop = page.getByRole('button', { name: 'Volver arriba en Productos', exact: true });
    await expect(productsTop).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('products-back-to-top.png') });
    await productsTop.click();
    await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBe(0);
    await expect(panel).toBeFocused();
    await expect(productsTop).toBeHidden();
    await page.getByRole('tab', { name: 'Páginas', exact: true }).click();
    await page.getByRole('button', { name: '1 fotos por página', exact: true }).click();
    const pages = page.getByRole('region', { name: 'Configuración de páginas', exact: true });
    await pages.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    const pagesTop = page.getByRole('button', { name: 'Volver arriba en Páginas', exact: true });
    await expect(pagesTop).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('pages-back-to-top.png') });
    await pagesTop.click();
    await expect.poll(() => pages.evaluate((element) => element.scrollTop)).toBe(0);
  });
}

test('per-page quantities reflow following products in order and survive reload', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(12));
  const ids = await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id));
  const occupancies = () => page.locator('.product-grid').evaluateAll((grids) => grids.map((grid) => grid.children.length));
  await page.getByRole('tab', { name: 'Páginas', exact: true }).click();
  await page.getByRole('combobox', { name: 'Fotos en página 2', exact: true }).selectOption('1');
  await expect.poll(occupancies).toEqual([1, 3, 3, 3, 2]);
  await page.getByRole('combobox', { name: 'Fotos en página 3', exact: true }).selectOption('5');
  await expect.poll(occupancies).toEqual([1, 5, 3, 3]);
  expect(await page.locator('.idx-page').allTextContents()).toEqual(['02', '03', '03', '03', '03', '03', '04', '04', '04', '05', '05', '05']);
  await expect(page.locator('.paginas-page-label')).toHaveText(['Página 2', 'Página 3', 'Página 4', 'Página 5']);
  await page.getByRole('combobox', { name: 'Fotos en página 2', exact: true }).selectOption('4');
  await expect.poll(occupancies).toEqual([4, 5, 3]);
  await page.getByRole('combobox', { name: 'Fotos en página 2', exact: true }).selectOption('');
  await expect.poll(occupancies).toEqual([3, 5, 3, 1]);
  await page.getByRole('button', { name: '2 fotos por página', exact: true }).click();
  await expect.poll(occupancies).toEqual([2, 5, 2, 2, 1]);
  await saved(page);
  await readyAfterReload(page);
  await expect.poll(occupancies).toEqual([2, 5, 2, 2, 1]);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id))).toEqual(ids);
  await expect(page.locator('.rs-page-sep')).toHaveText(['Página 2', 'Página 3', 'Página 4', 'Página 5', 'Página 6']);
  await page.evaluate(() => window.catalogTest.manageCatalog('settings'));
  await expect.poll(occupancies).toEqual([3, 3, 3, 3]);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id))).toEqual(ids);
});

test('failed per-page changes retain their draft and retry without changing product data', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(8);
    await h.settings.getState().setPageItemCount(0, 1);
    window.faults.failKey = 'cm:settings';
    await h.settings.getState().setPageItemCount(1, 5);
  });
  expect(await page.evaluate(() => window.catalogTest.settings.getState().pageItemCounts)).toEqual({ 0: 1, 1: 5 });
  expect(await page.evaluate(async () => (await window.catalogTest.dbLoadCatalog()).settings!.pageItemCounts)).toEqual({ 0: 1 });
  await expect(page.getByRole('button', { name: 'Reintentar guardado' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar guardado' }).first().click();
  await saved(page);
  await readyAfterReload(page);
  expect(await page.evaluate(() => window.catalogTest.settings.getState().pageItemCounts)).toEqual({ 0: 1, 1: 5 });
  const before = await page.evaluate(() => ({ writes: window.faults.writes, products: window.catalogTest.products.getState().products }));
  await page.evaluate(async () => {
    const settings = window.catalogTest.settings.getState();
    for (const [index, count] of [[-1, 2], [0, 0], [0, 6], [Infinity, 2], [0, NaN]]) await settings.setPageItemCount(index, count);
  });
  expect(await page.evaluate(() => ({ writes: window.faults.writes, products: window.catalogTest.products.getState().products }))).toEqual(before);
});

test('visible product highlighting follows page redistribution', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(9));
  const top = page.getByRole('button', { name: 'Volver arriba en Vista Previa', exact: true });
  await expect(top).toBeVisible();
  await top.click();
  await expect.poll(() => page.locator('.workspace').evaluate((element) => element.scrollTop)).toBe(0);
  const id = await page.evaluate(() => window.catalogTest.products.getState().products[2].id);
  for (const change of ['one', 'five', 'general'] as const) {
    await page.evaluate(async (change) => {
      const settings = window.catalogTest.settings.getState();
      if (change === 'general') {
        await settings.setPageItemCount(0, null);
        await settings.setItemsPerPage(2);
      } else await settings.setPageItemCount(0, change === 'one' ? 1 : 5);
    }, change);
    await page.locator(`[id="cell-${id}"]`).scrollIntoViewIfNeeded();
    await expect(page.locator(`.rs-card[data-id="${id}"]`)).toHaveClass(/rs-card-visible/);
  }
});

test('back to top cancels an ongoing automatic scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(12));
  const workspace = page.locator('.workspace');
  const button = page.getByRole('button', { name: 'Volver arriba en Vista Previa', exact: true });
  for (let iteration = 0; iteration < 5; iteration++) {
    await workspace.evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' }));
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBeGreaterThan(200);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(0);
  }
});

test('legacy quantity settings load and invalid per-page data is preserved with a visible error', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(6);
    await h.settings.getState().setPageItemCount(0, 1);
    const data = await h.dbLoadCatalog();
    delete data.settings!.pageItemCounts;
    const request = indexedDB.open('keyval-store');
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
    const tx = db.transaction('keyval', 'readwrite');
    tx.objectStore('keyval').put(data.settings, 'cm:settings');
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
    db.close();
  });
  await readyAfterReload(page);
  expect(await page.evaluate(() => window.catalogTest.settings.getState().pageItemCounts)).toEqual({});
  expect(await page.locator('.product-grid').evaluateAll((grids) => grids.map((grid) => grid.children.length))).toEqual([3, 3]);
  await page.evaluate(async () => {
    const data = await window.catalogTest.dbLoadCatalog();
    const request = indexedDB.open('keyval-store');
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
    const tx = db.transaction('keyval', 'readwrite');
    tx.objectStore('keyval').put({ ...data.settings, pageItemCounts: { 0: 6 } }, 'cm:settings');
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
    db.close();
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reintentar carga', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.faults.writes)).toBe(0);
});
