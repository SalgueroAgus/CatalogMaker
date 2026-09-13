import { test, expect } from './fixtures';
import { openApp, readyAfterReload, saved, showSection, downloadPDF } from './helpers';

const viewports = [
  { width: 360, height: 800 }, { width: 800, height: 360 },
  { width: 767, height: 900 }, { width: 768, height: 900 },
  { width: 1023, height: 900 }, { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

for (const viewport of viewports) {
  test(`readable reachable products and semantic navigation ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await openApp(page);
    await page.evaluate(() => window.catalogTest.fixture(12));
    await showSection(page, 'Artículos');
    const first = page.locator('.rs-card').first();
    await expect(first.getByLabel('Nombre', { exact: true })).toBeVisible();
    await expect(first.getByLabel('Precio', { exact: true })).toBeVisible();
    await expect(first.getByRole('button', { name: 'Detalles', exact: true })).toBeVisible();
    await expect(first.getByRole('button', { name: 'Cambiar foto', exact: true })).toBeHidden();
    const measures = await page.locator('.tool-panel').evaluate((panel) => ({
      inputs: Array.from(panel.querySelectorAll<HTMLInputElement>('input:not([type="file"])')).filter((input) => input.getClientRects().length).map((input) => Number.parseFloat(getComputedStyle(input).fontSize)),
      buttons: Array.from(panel.querySelectorAll<HTMLButtonElement>('button')).filter((button) => button.getClientRects().length).map((button) => ({ name: button.textContent, width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })),
      overflow: panel.scrollWidth > panel.clientWidth,
    }));
    expect(measures.inputs.every((size) => size >= 16)).toBe(true);
    expect(measures.buttons.filter((button) => button.width < 44 || button.height < 44)).toEqual([]);
    expect(measures.overflow).toBe(false);
    const last = page.locator('.rs-card').last();
    await last.getByLabel('Precio', { exact: true }).fill('$98765');
    await last.getByRole('button', { name: 'Detalles', exact: true }).click();
    await last.getByLabel('Descripción', { exact: true }).fill('ÚLTIMO PRODUCTO');
    await last.getByRole('button', { name: 'Subir', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.rs-card').nth(10)).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('products.png'), fullPage: true });
    await page.setViewportSize({ width: viewport.width, height: Math.max(320, viewport.height - 250) });
    await page.locator('.rs-card').last().getByRole('button', { name: 'Detalles', exact: true }).click();
    await page.locator('.rs-card').last().getByRole('button', { name: 'Eliminar producto 12' }).scrollIntoViewIfNeeded();
    await expect(page.locator('.rs-card').last().getByRole('button', { name: 'Eliminar producto 12' })).toBeInViewport();
    await saved(page);
    await readyAfterReload(page);
    expect(await page.evaluate(() => window.catalogTest.products.getState().products.some((p) => p.price === '$98765' && p.description === 'ÚLTIMO PRODUCTO'))).toBe(true);
  });
}

test('mobile sections keep export available after editing', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  await showSection(page, 'Artículos');
  await page.getByLabel('Precio', { exact: true }).fill('$19999');
  for (const section of ['Artículos', 'Páginas', 'Diseño'] as const) {
    await showSection(page, section);
    const download = page.waitForEvent('download');
    await downloadPDF(page);
    await (await download).saveAs(testInfo.outputPath(`mobile-${section}.pdf`));
    await expect(page.locator('body')).not.toHaveClass(/pdf-exporting/);
    expect(await page.evaluate(() => document.querySelectorAll('.catalog-capture').length)).toBe(0);
  }
});
