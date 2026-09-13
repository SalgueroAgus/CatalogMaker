import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures';
import { openApp, showSection, openManagement, downloadPDF } from './helpers';

const screenshots = '/private/tmp/catalogmaker-ui-rework/screenshots';

for (const width of [390, 800, 1440]) {
  test(`new editor sections and screenshots at ${width}px`, async ({ page }) => {
    await mkdir(screenshots, { recursive: true });
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openApp(page);
    await page.evaluate(() => window.catalogTest.fixture(6));
    await page.evaluate(() => {
      const store = window.catalogTest.products.getState();
      return store.updateField(store.products[0].id, 'name', 'THE BLOOM LOUNGE CHAIR');
    });
    await expect.poll(() => page.locator('.workspace').evaluate((el) => el.scrollTop)).toBeGreaterThan(200);
    await page.getByRole('button', { name: 'Volver arriba en Vista Previa' }).click();
    for (const section of ['Artículos', 'Páginas', 'Diseño'] as const) {
      await showSection(page, section);
      expect(await page.locator('.tool-panel').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.screenshot({ path: `${screenshots}/${width}-${section}.png` });
      if (section === 'Artículos') {
        const card = page.locator('.rs-card').first();
        const photo = await card.locator('.rs-thumb-wrap').boundingBox();
        const fields = await card.locator('.rs-fields').boundingBox();
        expect(photo!.y).toBeCloseTo(fields!.y, 0);
        expect(photo!.height).toBeCloseTo(fields!.height, 0);
        await expect(card.locator('.rs-field-label').first()).toHaveCSS('color', 'rgb(0, 0, 0)');
        await expect(card.getByLabel('Nombre', { exact: true })).toHaveCSS('color', 'rgb(0, 0, 0)');
        await expect(card.getByRole('button', { name: 'Detalles', exact: true })).toHaveCSS('color', 'rgb(0, 0, 0)');
      }
    }
    await page.getByRole('button', { name: 'Tipografía', exact: true }).click();
    await page.getByRole('button', { name: /Nombre empresa/ }).first().click();
    await page.getByRole('combobox', { name: 'Tipografía: Nombre empresa' }).click();
    await page.getByRole('option', { name: 'Georgia', exact: true }).click();
    expect(await page.evaluate(() => window.catalogTest.settings.getState().fonts.company)).toContain('Georgia');
    await page.getByRole('button', { name: 'Tipografía', exact: true }).click();
    await page.getByRole('button', { name: 'Fondo y colores', exact: true }).click();
    const colorTab = await page.getByRole('tab', { name: 'Color', exact: true }).boundingBox();
    const imageTab = await page.getByRole('tab', { name: 'Imagen', exact: true }).boundingBox();
    expect(colorTab!.width).toBeGreaterThanOrEqual(44);
    expect(imageTab!.x).toBeGreaterThanOrEqual(colorTab!.x + colorTab!.width);
    await page.getByRole('tab', { name: 'Imagen', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Cargar imagen', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Color', exact: true }).click();
    await page.screenshot({ path: `${screenshots}/${width}-fondo.png` });
    await page.getByRole('button', { name: 'Editar Fondo páginas', exact: true }).click();
    await expect(page.locator('.gpp-popover')).toBeInViewport();
    await showSection(page, 'Artículos');
    await expect(page.locator('.gpp-popover')).toHaveCount(0);
    await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
    await page.screenshot({ path: `${screenshots}/${width}-reordenar.png` });
    await page.getByRole('button', { name: 'Volver al editor' }).click();
    if (width >= 768) {
      const before = await page.locator('.page-a4').first().evaluate((el) => ({ width: getComputedStyle(el).width, zoom: Number(getComputedStyle(el).zoom) }));
      await page.getByRole('button', { name: 'Ocultar herramientas' }).click();
      await expect(page.locator('.tools-region')).toBeHidden();
      await expect.poll(() => page.locator('.page-a4').first().evaluate((el) => Number(getComputedStyle(el).zoom))).toBeGreaterThanOrEqual(before.zoom);
      expect(await page.locator('.page-a4').first().evaluate((el) => parseFloat(getComputedStyle(el).width))).toBeCloseTo(parseFloat(before.width), 1);
      await page.getByRole('button', { name: 'Mostrar herramientas' }).click();
    } else {
      await page.getByRole('button', { name: 'Vista previa', exact: true }).click();
      await page.screenshot({ path: `${screenshots}/${width}-preview.png` });
    }
    await expect(page.getByText('Guardado en este navegador', { exact: true })).toHaveCount(1);
  });
}

test('portalled selection and confirmations respect export locks', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(3));
  await showSection(page, 'Páginas');
  await page.getByRole('combobox', { name: 'Fotos en página 2' }).click();
  const acquire = () => page.evaluate(async () => {
    const { acquireExport } = await import('/src/store/catalogSession.ts');
    const release = acquireExport();
    window.addEventListener('test-release-export', () => release?.(), { once: true });
  });
  await acquire();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Fotos en página 2' })).toBeDisabled();
  await page.evaluate(() => window.dispatchEvent(new Event('test-release-export')));
  await openManagement(page);
  await page.getByRole('button', { name: 'Vaciar catálogo', exact: true }).click();
  await acquire();
  await expect(page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' })).toBeDisabled();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click();
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.length)).toBe(3);
  await page.evaluate(() => window.dispatchEvent(new Event('test-release-export')));
});

test('PDF hook reports failures in the new alert dialog and can retry', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  await page.evaluate(() => {
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = () => Promise.reject(new Error('Injected image decode failure'));
    window.addEventListener('test-restore-decode', () => { HTMLImageElement.prototype.decode = decode; }, { once: true });
  });
  await downloadPDF(page);
  await expect(page.getByRole('alertdialog')).toContainText('Error al generar el PDF');
  await page.getByRole('button', { name: 'Entendido', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Descargar PDF', exact: true })).toBeFocused();
  expect(await page.evaluate(() => window.catalogTest.persistence.getState().exporting)).toBe(false);
  await page.evaluate(() => window.dispatchEvent(new Event('test-restore-decode')));
  const downloaded = page.waitForEvent('download');
  await downloadPDF(page);
  expect((await downloaded).suggestedFilename()).toMatch(/\.pdf$/);
});
