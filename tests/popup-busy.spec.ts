import { test, expect } from './fixtures';
import { openApp, saved } from './helpers';

for (const kind of ['product', 'page'] as const) {
  test(`${kind} color popup closes during keyboard-started export and later edits persist`, async ({ page }, testInfo) => {
    await openApp(page);
    await page.evaluate(() => window.catalogTest.fixture(2));
    const label = kind === 'product' ? 'Fondo del producto' : 'Fondo páginas';
    if (kind === 'page') await page.getByRole('button', { name: 'Página', exact: true }).first().click();
    if (kind === 'product') await page.locator('.rs-card').first().getByRole('button', { name: 'Detalles', exact: true }).click();
    const swatch = page.getByRole('button', { name: `Editar ${label}`, exact: true }).first();
    await swatch.click();
    await expect(page.getByRole('dialog', { name: label })).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar PDF', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await (await download).saveAs(testInfo.outputPath('popup-export.pdf'));
    await expect(page.locator('body')).not.toHaveClass(/pdf-exporting/);
    await swatch.click();
    const hex = page.getByLabel(`${label}: HEX`, { exact: true });
    await hex.fill('00FF00');
    await hex.press('Tab');
    await saved(page);
    const color = await page.evaluate(async (kind) => {
      const data = await window.catalogTest.dbLoadCatalog();
      return kind === 'product' ? data.products[0].bgColor : data.settings!.colors.bg;
    }, kind);
    expect(color.replace(/\s/g, '')).toBe('rgba(0,255,0,1)');
  });
}
