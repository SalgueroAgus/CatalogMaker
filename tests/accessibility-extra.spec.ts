import { test, expect } from './fixtures';
import { openApp, saved, readyAfterReload, showSection } from './helpers';

for (const width of [360, 768, 1200]) {
  test(`preview photo actions retain a 44px target at width ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await openApp(page);
    await page.evaluate(() => window.catalogTest.fixture(5, 5));
    const measured = await page.locator('.cell-img-overlay').evaluateAll((buttons) => buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height, label: button.getAttribute('aria-label') };
    }));
    await testInfo.attach('preview-targets', { body: JSON.stringify(measured, null, 2), contentType: 'application/json' });
    expect(measured.filter((button) => button.width < 44 || button.height < 44)).toEqual([]);
  });
}

test('mobile product preview action reveals the requested product', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(12));
  await showSection(page, 'Artículos');
  const card = page.locator('.rs-card').nth(5);
  const id = await card.getAttribute('data-id');
  await card.getByRole('button', { name: 'Ver catálogo, artículo 6', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Vista previa', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator(`[id="cell-${id}"]`)).toBeInViewport();
  await expect(page.locator(`[id="cell-${id}"]`)).toBeFocused();
});

test('keyboard-only essential editor workflow keeps focus, actions, saving and errors accessible', async ({ page }) => {
  await openApp(page);
  const activate = async (name: string) => {
    const button = page.getByRole('button', { name, exact: true }).first();
    await button.focus();
    await page.keyboard.press('Enter');
  };
  await activate('Agregar producto');
  const name = page.getByLabel('Nombre', { exact: true }).first();
  await name.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('TECLADO');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Precio', { exact: true }).first()).toBeFocused();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('$12345');
  await activate('Detalles');
  await page.getByLabel('Descripción', { exact: true }).first().focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('DESCRIPCION');
  const choice = page.waitForEvent('filechooser');
  await activate('Cambiar foto');
  const png = await page.evaluate(async () => Array.from(new Uint8Array(await (await window.catalogTest.photo()).arrayBuffer())));
  await (await choice).setFiles({ name: 'keyboard.png', mimeType: 'image/png', buffer: Buffer.from(png) });
  await saved(page);
  await activate('Agregar producto');
  await page.locator('.rs-card').last().getByRole('button', { name: 'Detalles', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.locator('.rs-card').last().getByRole('button', { name: 'Subir', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.rs-card').first().getByRole('button', { name: 'Bajar', exact: true })).toBeFocused();
  await saved(page);
  await readyAfterReload(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    window.faults.failKey = 'cm:products';
    await h.products.getState().updateField(h.products.getState().products[0].id, 'price', '$99999');
  });
  await activate('Reintentar guardado');
  await saved(page);
  await activate('Menú del catálogo');
  await page.getByRole('menuitem', { name: 'Administración del catálogo' }).focus();
  await page.keyboard.press('Enter');
  for (const action of ['Vaciar catálogo', 'Restablecer ajustes', 'Restablecer todo']) {
    await activate(action);
    await activate('Cancelar');
  }
  await activate('Cerrar');
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.length)).toBe(2);
  const download = page.waitForEvent('download');
  await activate('Descargar PDF');
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
});
