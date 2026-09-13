import { test, expect } from './fixtures';
import { openApp, readyAfterReload, saved, showSection, openManagement } from './helpers';

for (const width of [320, 390, 768, 1000, 1440]) {
  test(`compact editing and page navigation with 200 articles at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await openApp(page);
    await page.evaluate(() => window.catalogTest.fixture(200));
    await showSection(page, 'Artículos');
    const card = page.locator('.rs-card').first();
    const measures = await card.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      photo: element.querySelector('.rs-thumb-wrap')!.getBoundingClientRect().width,
      font: getComputedStyle(element.querySelector('textarea')!).fontSize,
      targets: Array.from(element.querySelectorAll('button')).filter((button) => button.getClientRects().length).map((button) => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })),
    }));
    expect(measures.height).toBeLessThanOrEqual(260);
    expect(measures.photo).toBeCloseTo(112, 1);
    expect(measures.font).toBe('16px');
    expect(measures.targets.every((target) => target.width >= 44 && target.height >= 44)).toBe(true);
    for (let index = 0; index < 5; index++) await page.locator('.rs-card').nth(index).getByLabel('Precio', { exact: true }).fill(`$${1000 + index}`);
    await saved(page);
    await page.getByLabel('Buscar artículos', { exact: true }).fill('200');
    await expect(page.locator('.rs-card')).toHaveCount(1);
    await expect(page.locator('.rs-page-sep')).toHaveText('Página 74');
    await page.getByRole('button', { name: 'Detalles', exact: true }).click();
    await page.getByLabel('Descripción', { exact: true }).fill('ÚLTIMO EDITADO');
    await showSection(page, 'Páginas');
    await showSection(page, 'Artículos');
    await expect(page.getByLabel('Buscar artículos', { exact: true })).toHaveValue('200');
    await expect(page.getByLabel('Descripción', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Reordenar artículos', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.reorder-card')).toHaveCount(200);
    await expect(dialog.locator('.reorder-selected')).toHaveAttribute('data-reorder-id', await page.locator('.rs-card').getAttribute('data-id'));
    await expect(dialog.getByRole('button', { name: 'Ir a página 74', exact: true })).toBeInViewport();
    await dialog.getByLabel('Buscar artículo', { exact: true }).fill('PRODUCTO 001');
    await expect(dialog.locator('.reorder-card')).toHaveCount(200);
    await expect(dialog.locator('.reorder-card').first()).toBeInViewport();
    const layout = await dialog.evaluate((element) => {
      const nav = element.querySelector('.reorder-pages')!;
      const gallery = element.querySelector('.reorder-gallery')!;
      return { overflow: element.scrollWidth > element.clientWidth, nav: nav.getBoundingClientRect().toJSON(), gallery: gallery.getBoundingClientRect().toJSON(), columns: getComputedStyle(element.querySelector('.reorder-grid')!).gridTemplateColumns.split(' ').length };
    });
    expect(layout.overflow).toBe(false);
    if (width < 768) { expect(layout.columns).toBe(2); expect(layout.nav.bottom).toBeLessThanOrEqual(layout.gallery.top + 1); }
    else expect(layout.nav.left).toBeGreaterThanOrEqual(layout.gallery.right - 1);
    await dialog.getByRole('button', { name: 'Ir a página 10', exact: true }).click();
    await expect(dialog.locator('.reorder-selected')).toHaveAttribute('data-reorder-id', await page.evaluate(() => window.catalogTest.products.getState().products[6].id));
    await expect(dialog.locator('.reorder-selected .reorder-select')).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath(`reorder-${width}.png`) });
    await dialog.getByRole('button', { name: 'Volver al editor', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Reordenar', exact: true })).toBeFocused();
    await expect(page.getByLabel('Buscar artículos', { exact: true })).toHaveValue('200');
    await expect(page.getByLabel('Descripción', { exact: true })).toHaveValue('ÚLTIMO EDITADO');
    await saved(page);
    await readyAfterReload(page);
    expect(await page.evaluate(() => window.catalogTest.products.getState().products.slice(0, 5).map((product) => product.price))).toEqual(['$ 1.000', '$ 1.001', '$ 1.002', '$ 1.003', '$ 1.004']);
  });
}

test('search keeps a renamed article editable, then releases it and preserves the catalog', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(50);
    await h.products.getState().updateField(h.products.getState().products[0].id, 'name', 'SILLÓN AZUL');
    await h.products.getState().updateField(h.products.getState().products[1].id, 'name', 'SILLÓN VERDE');
  });
  const ids = await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id));
  await page.getByLabel('Buscar artículos', { exact: true }).fill('sillon');
  await expect(page.locator('.rs-card')).toHaveCount(2);
  const first = page.locator('.rs-card').first();
  await first.getByLabel('Nombre', { exact: true }).fill('MESA');
  await expect(page.locator('.rs-card')).toHaveCount(2);
  await first.getByLabel('Precio', { exact: true }).fill('$999');
  await page.locator('.rs-card').nth(1).getByRole('button', { name: 'Detalles', exact: true }).click();
  await expect(page.locator('.rs-card')).toHaveCount(1);
  await expect(page.getByLabel('Descripción', { exact: true })).toBeVisible();
  await page.getByLabel('Buscar artículos', { exact: true }).fill('inexistente');
  await expect(page.getByText('No encontramos artículos con ese nombre.')).toBeVisible();
  await page.getByRole('button', { name: 'Mostrar todos', exact: true }).click();
  await expect(page.locator('.rs-card')).toHaveCount(50);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id))).toEqual(ids);
  await expect(page.locator('.rs-card').first().getByLabel('Precio', { exact: true })).toHaveValue('$ 999');
});

test('long moves, undo, invalid destinations and failed saves retain article identity', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.fixture(200);
    await h.products.getState().replaceImage(h.products.getState().products[199].id, await h.photo());
  });
  const before = await page.evaluate(() => window.catalogTest.products.getState().products);
  const resources = await page.evaluate(() => ({ created: window.faults.created.length, revoked: window.faults.revoked.length }));
  await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Reordenar artículos', exact: true });
  await dialog.getByLabel('Buscar artículo', { exact: true }).fill('200');
  await dialog.getByLabel('Mover a posición', { exact: true }).fill('0');
  await dialog.getByRole('button', { name: 'Mover', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('entre 1 y 200');
  await dialog.getByLabel('Mover a posición', { exact: true }).fill('1');
  await dialog.getByRole('button', { name: 'Mover', exact: true }).click();
  await saved(page);
  await expect(dialog.locator('.reorder-card').first()).toHaveAttribute('data-reorder-id', before[199].id);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products[0])).toEqual(before[199]);
  await expect(dialog.getByRole('button', { name: 'Subir', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Deshacer último movimiento', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByLabel('Mover a posición', { exact: true })).toBeFocused();
  await saved(page);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products)).toEqual(before);
  await expect(dialog.getByRole('button', { name: 'Deshacer último movimiento', exact: true })).toBeDisabled();
  await page.evaluate(() => { window.faults.failKey = 'cm:products'; });
  await dialog.getByLabel('Mover a posición', { exact: true }).fill('5');
  await dialog.getByRole('button', { name: 'Mover', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Reintentar guardado', exact: true })).toBeVisible();
  await expect(dialog.locator('.reorder-card').nth(4)).toHaveAttribute('data-reorder-id', before[199].id);
  await dialog.getByRole('button', { name: 'Reintentar guardado', exact: true }).click();
  await saved(page);
  await dialog.getByRole('button', { name: 'Limpiar', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByLabel('Buscar artículo', { exact: true })).toBeFocused();
  await expect(dialog.getByLabel('Buscar artículo', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => ({ created: window.faults.created.length, revoked: window.faults.revoked.length }))).toEqual(resources);
  await dialog.getByRole('button', { name: 'Volver al editor', exact: true }).click();
  await readyAfterReload(page);
  const order = [before[0], before[1], before[2], before[3], before[199], ...before.slice(4, 199)].map((product) => product.id);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id))).toEqual(order);
});

test('drag cancellation, outside drop, edge scrolling and modal focus', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(200));
  const ids = await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id));
  await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Reordenar artículos', exact: true });
  await expect(dialog.getByRole('button', { name: 'Volver al editor', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.querySelector('.reorder-view')!.contains(document.activeElement))).toBe(true);
  const grip = await dialog.locator('.reorder-grip').first().boundingBox();
  const gallery = dialog.locator('.reorder-gallery');
  const bounds = await gallery.boundingBox();
  await page.mouse.move(grip!.x + 22, grip!.y + 22);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + 60, bounds!.y + bounds!.height - 4, { steps: 10 });
  await expect.poll(() => gallery.evaluate((element) => element.scrollTop)).toBeGreaterThan(200);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await page.mouse.up();
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id))).toEqual(ids);
  await gallery.evaluate((element) => { element.scrollTop = 0; });
  const nextGrip = await dialog.locator('.reorder-grip').first().boundingBox();
  await page.mouse.move(nextGrip!.x + 22, nextGrip!.y + 22);
  await page.mouse.down();
  await page.mouse.move(10, 10, { steps: 10 });
  await page.mouse.up();
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id))).toEqual(ids);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reordenar', exact: true })).toBeFocused();
});

test('touch drag moves an article and the photo area still permits scrolling', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Uses Chromium touch input to exercise real pointer capture.');
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(50));
  await showSection(page, 'Artículos');
  await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
  const source = page.locator('.reorder-card').nth(1);
  const sourceId = await source.getAttribute('data-reorder-id');
  const handle = await source.locator('.reorder-grip').boundingBox();
  const target = await page.locator('.reorder-card').first().boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: handle!.x + 22, y: handle!.y + 22 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: target!.x + 20, y: target!.y + 100 }] });
  await expect(page.locator('.reorder-before')).toHaveCount(1);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('.reorder-card').first()).toHaveAttribute('data-reorder-id', sourceId!);
  const gallery = page.locator('.reorder-gallery');
  const bounds = await gallery.boundingBox();
  const x = bounds!.x + 70;
  const bottom = bounds!.y + bounds!.height - 20;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: bottom }] });
  for (const offset of [20, 40, 80, 120, 160]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: bottom - offset }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => gallery.evaluate((element) => element.scrollTop)).toBeGreaterThan(20);
  await cdp.detach();
  await saved(page);
});

test('miniatures share every layout with real pages and preserve customized pagination', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(31));
  await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
  await expect(page.locator('.reorder-page').first()).toHaveAccessibleName('Ir a página 3');
  const checks = await page.evaluate(async () => {
    const h = window.catalogTest;
    const { SHAPE_ITEM_COUNT } = await import('/src/types/index.ts');
    const rows: boolean[] = [];
    for (const [shape, count] of Object.entries(SHAPE_ITEM_COUNT) as [Parameters<ReturnType<typeof h.settings.getState>['setPageLayout']>[1], number][]) {
      await h.fixture(count, count);
      await h.settings.getState().setPageLayout(0, shape);
      await new Promise(requestAnimationFrame);
      const actual = document.querySelector('.workspace .product-grid')!;
      const miniature = document.querySelector('.reorder-page-sheet')!;
      const placements = (element: Element) => Array.from(element.children).map((child) => {
        const style = getComputedStyle(child);
        return [style.gridColumnStart, style.gridColumnEnd, style.gridRowStart, style.gridRowEnd].join('/');
      });
      rows.push(actual.classList.contains(`grid-${shape}`) && miniature.classList.contains(`grid-${shape}`) && JSON.stringify(placements(actual)) === JSON.stringify(placements(miniature)));
    }
    await h.fixture(31, 3);
    await h.settings.getState().setPageItemCount(0, 1);
    await h.settings.getState().setPageItemCount(1, 5);
    return rows;
  });
  expect(checks.every(Boolean)).toBe(true);
  await expect(page.locator('.reorder-page-sheet').first().locator('img')).toHaveCount(1);
  await expect(page.locator('.reorder-page-sheet').nth(1).locator('img')).toHaveCount(5);
  expect(await page.locator('.reorder-page-sheet').evaluateAll((pages) => pages.map((page) => page.children.length))).toEqual(await page.locator('.workspace .product-grid').evaluateAll((pages) => pages.map((page) => page.children.length)));
  expect(await page.locator('.reorder-view .page-a4, .reorder-page-sheet input, .reorder-page-sheet textarea').count()).toBe(0);
});

test('editing context survives mobile preview and page tabs, and hidden panels close popovers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(50));
  await showSection(page, 'Artículos');
  const card = page.locator('.rs-card').nth(10);
  await card.getByRole('button', { name: 'Detalles', exact: true }).click();
  const panel = page.locator('.articles-content');
  const original = await panel.evaluate((element) => element.scrollTop);
  await showSection(page, 'Páginas');
  await showSection(page, 'Artículos');
  await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBe(original);
  await expect(card.getByLabel('Descripción', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Ver catálogo, artículo 11', exact: true }).click();
  await showSection(page, 'Artículos');
  await expect(card.getByLabel('Descripción', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Editar Fondo del producto', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'Páginas', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Fondo del producto', exact: true })).toHaveCount(0);
});

test('short viewports keep movement controls reachable without moving the outer view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(50));
  await showSection(page, 'Artículos');
  await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Reordenar artículos', exact: true });
  const skip = dialog.getByRole('button', { name: 'Ir a controles de movimiento', exact: true });
  await skip.focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByLabel('Mover a posición', { exact: true })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 360 });
  const input = dialog.getByLabel('Mover a posición', { exact: true });
  await input.scrollIntoViewIfNeeded();
  await input.fill('50');
  await input.press('Enter');
  await expect(input).toBeFocused();
  await expect(input).toBeInViewport();
  await saved(page);
  await expect(dialog.locator('.reorder-selection')).toContainText('Artículo 50 de 50');
});

test('starting a catalog export cancels an active drag and keeps the saved order', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(50));
  const ids = await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id));
  await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
  const grip = await page.locator('.reorder-grip').first().boundingBox();
  await page.mouse.move(grip!.x + 22, grip!.y + 22);
  await page.mouse.down();
  await page.mouse.move(grip!.x + 50, grip!.y + 60);
  await expect(page.locator('.reorder-drag-ghost')).toBeVisible();
  await page.evaluate(async () => {
    const { acquireExport } = await import('/src/store/catalogSession.ts');
    const release = acquireExport();
    window.addEventListener('test-release-export', () => release?.(), { once: true });
  });
  await expect(page.locator('.reorder-drag-ghost')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator('.reorder-grip').first()).toBeDisabled();
  await page.evaluate(() => window.dispatchEvent(new Event('test-release-export')));
  await expect(page.locator('.reorder-grip').first()).toBeEnabled();
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.map((product) => product.id))).toEqual(ids);
});

test('emptying a filtered catalog allows starting a visible new article', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(50));
  await page.getByLabel('Buscar artículos', { exact: true }).fill('050');
  await openManagement(page);
  await page.getByRole('button', { name: 'Vaciar catálogo', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.getByRole('dialog', { name: 'Administración del catálogo' }).getByRole('button', { name: 'Cerrar', exact: true }).click();
  await saved(page);
  await page.getByRole('button', { name: 'Agregar artículo', exact: true }).click();
  await expect(page.locator('.rs-card')).toHaveCount(1);
  await expect(page.getByLabel('Buscar artículos', { exact: true })).toHaveValue('');
  await expect(page.locator('.rs-card').getByLabel('Nombre', { exact: true })).toHaveValue('NUEVO ARTÍCULO');
});
