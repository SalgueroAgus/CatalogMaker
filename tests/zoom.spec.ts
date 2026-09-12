import { test, expect } from './fixtures';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const inspector = `/private/tmp/catalogmaker-inspect-zoom-${process.pid}`;
test.beforeAll(async () => {
  await execute('swiftc', ['-module-cache-path', '/private/tmp/catalogmaker-swift-cache', 'tests/inspect-pdf.swift', '-o', inspector]);
});
import { openApp, readyAfterReload, saved } from './helpers';

test('200% actual desktop browser zoom through Chromium native settings', async ({ playwright }, testInfo) => {
  const profile = await mkdtemp('/private/tmp/catalogmaker-zoom-');
  const context = await playwright.chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, viewport: null, args: ['--window-size=1440,1000'], baseURL: 'http://127.0.0.1:5173' });
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
    await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
    await page.getByRole('button', { name: 'Agregar Producto', exact: true }).click();
    await page.getByRole('button', { name: 'Productos', exact: true }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('VALOR LEGIBLE CON ZOOM');
    await page.getByLabel('Precio', { exact: true }).fill('$123456');
    await page.getByRole('button', { name: 'Descripción', exact: true }).click();
    await page.getByLabel('Descripción', { exact: true }).fill('Descripción con zoom real del navegador.');
    await page.getByRole('button', { name: 'Cambiar foto', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Cambiar foto', exact: true })).toBeInViewport();
    const photo = await page.evaluate(async () => Array.from(new Uint8Array(await (await window.catalogTest.photo()).arrayBuffer())));
    const choose = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Cambiar foto', exact: true }).click();
    await (await choose).setFiles({ name: 'zoom.png', mimeType: 'image/png', buffer: Buffer.from(photo) });
    await saved(page);
    await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
    await page.getByRole('button', { name: 'Agregar Producto', exact: true }).click();
    await page.getByRole('button', { name: 'Productos', exact: true }).click();
    await page.locator('.rs-card').last().getByRole('button', { name: 'Subir', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.rs-card').first().getByRole('button', { name: 'Bajar', exact: true })).toBeFocused();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Eliminar producto 1', exact: true }).click();
    await saved(page);
    await expect(page.locator('.rs-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Ver producto 1 en la vista previa', exact: true }).click();
    await expect(page.locator('.product-cell')).toBeFocused();
    await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
    await page.getByRole('button', { name: 'Marca', exact: true }).click();
    await page.getByLabel('Empresa', { exact: true }).fill('CATÁLOGO ZOOM');
    await page.getByLabel('Contacto', { exact: true }).fill('CONTACTO CON ZOOM');
    await saved(page);
    await page.getByRole('button', { name: 'Administración del catálogo', exact: true }).click();
    page.on('dialog', (dialog) => dialog.dismiss());
    for (const action of ['Vaciar catálogo', 'Restablecer ajustes', 'Restablecer todo']) {
      await page.getByRole('button', { name: action, exact: true }).click();
    }
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar PDF', exact: true }).click();
    const output = testInfo.outputPath('zoom-200.pdf');
    await (await download).saveAs(output);
    const inspected = await execute(inspector, [output]);
    await writeFile(testInfo.outputPath('zoom-200-pdf.json'), inspected.stdout);
    const pdf: { count: number; pages: { footerText: string[] }[] } = JSON.parse(inspected.stdout);
    expect(pdf.count).toBe(2);
    expect(pdf.pages[1].footerText.join(' ')).toContain('$123456');
    await page.getByRole('button', { name: 'Productos', exact: true }).click();
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('VALOR LEGIBLE CON ZOOM');
    await expect(page.getByRole('button', { name: 'Productos', exact: true })).toHaveAttribute('aria-current', 'page');
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
