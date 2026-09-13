import { test, expect } from './fixtures';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const inspector = `/private/tmp/catalogmaker-inspect-zoom-${process.pid}`;
test.beforeAll(async () => {
  await execute('swiftc', ['-module-cache-path', '/private/tmp/catalogmaker-swift-cache', 'tests/inspect-pdf.swift', '-o', inspector]);
});
import { openApp, readyAfterReload, saved, showSection, openManagement, downloadPDF } from './helpers';

test('200% actual desktop browser zoom through Chromium native settings', async ({ playwright, launchOptions, baseURL }, testInfo) => {
  const profile = await mkdtemp('/private/tmp/catalogmaker-zoom-');
  const context = await playwright.chromium.launchPersistentContext(profile, { ...launchOptions, headless: true, viewport: null, args: ['--window-size=1440,1000'], baseURL });
  try {
    const page = context.pages()[0];
    await page.goto('chrome://settings/appearance');
    await page.locator('#zoomLevel').selectOption({ label: '200%' });
    await expect(page.locator('#zoomLevel')).toHaveValue('2');
    await openApp(page);
    const dimensions = await page.evaluate(() => ({ outerWidth, innerWidth, devicePixelRatio, visualScale: visualViewport?.scale, cssZoom: getComputedStyle(document.documentElement).zoom }));
    expect(dimensions.outerWidth / dimensions.innerWidth).toBeCloseTo(2, 1);
    expect(dimensions.visualScale).toBe(1);
    expect(dimensions.cssZoom).toBe('1');
    await writeFile(testInfo.outputPath('actual-zoom.json'), JSON.stringify(dimensions, null, 2));
    await showSection(page, 'Artículos');
    await page.getByRole('button', { name: 'Agregar producto', exact: true }).click();
    await showSection(page, 'Artículos');
    await page.getByLabel('Nombre', { exact: true }).fill('VALOR LEGIBLE CON ZOOM');
    await page.getByLabel('Precio', { exact: true }).fill('$123456');
    await page.getByRole('button', { name: 'Detalles', exact: true }).click();
    await page.getByLabel('Descripción', { exact: true }).fill('Descripción con zoom real del navegador.');
    await page.getByRole('button', { name: 'Cambiar foto', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Cambiar foto', exact: true })).toBeInViewport();
    const photo = await page.evaluate(async () => Array.from(new Uint8Array(await (await window.catalogTest.photo()).arrayBuffer())));
    const choose = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Cambiar foto', exact: true }).click();
    await (await choose).setFiles({ name: 'zoom.png', mimeType: 'image/png', buffer: Buffer.from(photo) });
    await saved(page);
    await showSection(page, 'Artículos');
    await page.getByRole('button', { name: 'Agregar producto', exact: true }).click();
    await showSection(page, 'Artículos');
    await page.locator('.rs-card').last().getByRole('button', { name: 'Detalles', exact: true }).click();
    await page.locator('.rs-card').last().getByRole('button', { name: 'Subir', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.rs-card').first().getByRole('button', { name: 'Bajar', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
    const reorder = page.getByRole('dialog', { name: 'Reordenar artículos', exact: true });
    expect(await reorder.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(reorder.locator('.reorder-page')).toHaveCount(1);
    await reorder.getByLabel('Mover a posición', { exact: true }).fill('2');
    await reorder.getByRole('button', { name: 'Mover', exact: true }).click();
    await expect(reorder.locator('.reorder-selection')).toContainText('Artículo 2 de 2');
    await reorder.getByRole('button', { name: 'Deshacer último movimiento', exact: true }).click();
    await expect(reorder.getByLabel('Mover a posición', { exact: true })).toBeFocused();
    await reorder.getByRole('button', { name: 'Volver al editor', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Reordenar', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Eliminar producto 1', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await saved(page);
    await expect(page.locator('.rs-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Ver catálogo, artículo 1', exact: true }).click();
    await expect(page.locator('.product-cell')).toBeFocused();
    await showSection(page, 'Diseño');
    await page.getByLabel('Empresa', { exact: true }).fill('CATÁLOGO ZOOM');
    await page.getByLabel('Contacto', { exact: true }).fill('CONTACTO CON ZOOM');
    await saved(page);
    await openManagement(page);
    for (const action of ['Vaciar catálogo', 'Restablecer ajustes', 'Restablecer todo']) {
      await page.getByRole('button', { name: action, exact: true }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
    }
    await page.getByRole('dialog', { name: 'Administración del catálogo' }).getByRole('button', { name: 'Cerrar', exact: true }).click();
    const download = page.waitForEvent('download');
    await downloadPDF(page);
    const output = testInfo.outputPath('zoom-200.pdf');
    await (await download).saveAs(output);
    const inspected = await execute(inspector, [output]);
    await writeFile(testInfo.outputPath('zoom-200-pdf.json'), inspected.stdout);
    const pdf: { count: number; pages: { footerText: string[] }[] } = JSON.parse(inspected.stdout);
    expect(pdf.count).toBe(2);
    expect(pdf.pages[1].footerText.join(' ')).toContain('$123456');
    await showSection(page, 'Artículos');
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('VALOR LEGIBLE CON ZOOM');
    await expect(page.getByRole('button', { name: 'Artículos', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect.poll(() => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running' && animation.effect?.getComputedTiming().iterations !== Infinity).length)).toBe(0);
    const cdp = await context.newCDPSession(page);
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(testInfo.outputPath('zoom-200.png'), Buffer.from(screenshot.data, 'base64'));
    await cdp.detach();
    await saved(page);
    await readyAfterReload(page);
    expect(await page.evaluate(() => window.catalogTest.products.getState().products[0].price)).toBe('$123456');
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
