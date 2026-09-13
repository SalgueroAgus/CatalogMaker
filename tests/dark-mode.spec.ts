import { test, expect } from './fixtures';
import { openApp, readyAfterReload, showSection, openManagement } from './helpers';
import { measureThemeContrast, measureThemeBoundaries } from './theme-contrast';

test('theme is initially light, keyboard accessible, persistent and independent of catalog writes and resets', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(2));
  const toggle = page.getByRole('switch', { name: 'Modo oscuro' });
  await expect(toggle).not.toBeChecked();
  const before = await page.evaluate(() => ({ writes: window.faults.writes, saving: window.catalogTest.persistence.getState().saving, settings: window.catalogTest.settings.getState().colors }));
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toBeChecked();
  await expect(toggle).toBeFocused();
  await expect(page.locator('.workspace')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  expect(await page.evaluate(() => ({ writes: window.faults.writes, saving: window.catalogTest.persistence.getState().saving, settings: window.catalogTest.settings.getState().colors }))).toEqual(before);
  await readyAfterReload(page);
  await expect(toggle).toBeChecked();
  for (const action of ['settings', 'products', 'everything'] as const) {
    await page.evaluate((action) => window.catalogTest.manageCatalog(action), action);
    await expect(toggle).toBeChecked();
  }
  for (let i = 0; i < 8; i++) await toggle.click();
  await expect(toggle).toBeChecked();
  await page.locator('.theme-switch').click({ position: { x: 10, y: 20 } });
  await expect(toggle).not.toBeChecked();
  await readyAfterReload(page);
  await expect(toggle).not.toBeChecked();
});

for (const failure of ['invalid', 'read', 'write'] as const) {
  test(`theme storage ${failure} failure does not block the catalog`, async ({ page }) => {
    await page.addInitScript((failure) => {
      if (failure === 'invalid') localStorage.setItem('cm:ui-theme', 'invalid');
      const get = Storage.prototype.getItem;
      const set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) {
        if (failure === 'read' && key === 'cm:ui-theme') throw new DOMException('Blocked', 'SecurityError');
        return get.call(this, key);
      };
      Storage.prototype.setItem = function (key, value) {
        if (failure === 'write' && key === 'cm:ui-theme') throw new DOMException('Full', 'QuotaExceededError');
        return set.call(this, key, value);
      };
    }, failure);
    await openApp(page);
    const toggle = page.getByRole('switch', { name: 'Modo oscuro' });
    await expect(toggle).not.toBeChecked();
    await toggle.click();
    await expect(toggle).toBeChecked();
    await expect(page.locator('.workspace')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    if (failure === 'write') await expect(page.getByRole('status').filter({ hasText: 'No se pudo recordar' })).toBeVisible();
    await page.evaluate(() => window.catalogTest.fixture(1));
    expect(await page.evaluate(() => window.catalogTest.persistence.getState().saving)).toBe('saved');
  });
}

test('theme switch stays available while catalog save or export is busy', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  await page.evaluate(() => {
    window.faults.delay = 1500;
    void window.catalogTest.settings.getState().updateStoreName('GUARDANDO');
  });
  const toggle = page.getByRole('switch', { name: 'Modo oscuro' });
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect.poll(() => page.evaluate(() => window.catalogTest.persistence.getState().saving)).toBe('saved');
  await page.evaluate(() => {
    const release = window.catalogTest.acquireExport();
    window.addEventListener('release-theme-export', () => release?.(), { once: true });
  });
  await expect(page.getByRole('button', { name: 'Descargar PDF', exact: true })).toBeDisabled();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await page.evaluate(() => window.dispatchEvent(new Event('release-theme-export')));
});

test('saved dark theme covers loading and recoverable error states', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cm:ui-theme', 'dark'));
  await openApp(page, { readFailures: 1 });
  await expect(page.getByRole('alert')).toContainText('No se pudo cargar');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  expect((await measureThemeContrast(page)).filter((item) => item.text < 7)).toEqual([]);
  await page.getByRole('button', { name: 'Reintentar carga' }).click();
  await expect(page.getByRole('switch', { name: 'Modo oscuro' })).toBeChecked();
  await page.evaluate(async () => {
    await window.catalogTest.fixture(1);
    window.faults.failKey = 'cm:settings';
    await window.catalogTest.settings.getState().updateStoreName('ERROR DE GUARDADO');
  });
  await expect(page.getByRole('alert')).toContainText('No se guardaron');
  expect((await measureThemeContrast(page)).filter((item) => item.text < 7)).toEqual([]);
  await page.getByRole('button', { name: 'Reintentar guardado' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

for (const width of [320, 390, 768, 1440]) {
  test(`OLED editor and portals stay readable and reachable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openApp(page);
    await page.evaluate(() => window.catalogTest.fixture(3));
    const toggle = page.getByRole('switch', { name: 'Modo oscuro' });
    await toggle.click();
    await expect(toggle).toBeInViewport();
    const size = await toggle.boundingBox();
    expect(size!.width).toBeGreaterThanOrEqual(44);
    expect(size!.height).toBeGreaterThanOrEqual(44);
    const audit = async (name: string) => {
      const measured = await measureThemeContrast(page);
      await testInfo.attach(name, { body: JSON.stringify(measured, null, 2), contentType: 'application/json' });
      expect(measured.filter((item) => item.text < 7 || (item.placeholder !== null && item.placeholder < 7))).toEqual([]);
      const boundaries = await measureThemeBoundaries(page);
      await testInfo.attach(`${name}-boundaries`, { body: JSON.stringify(boundaries, null, 2), contentType: 'application/json' });
      expect(boundaries.filter((item) => item.contrast < 3)).toEqual([]);
      expect(await page.locator('.editor-header').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    };
    for (const section of ['Artículos', 'Páginas', 'Diseño'] as const) {
      await showSection(page, section);
      await audit(section);
      await page.screenshot({ path: testInfo.outputPath(`${width}-${section}.png`) });
      if (section === 'Artículos') {
        await page.keyboard.press('Tab');
        await toggle.focus();
        await audit('switch-focus');
        await page.getByRole('button', { name: 'Cargar fotos', exact: true }).focus();
        await audit('primary-focus');
        await page.getByRole('button', { name: 'Agregar producto', exact: true }).hover();
        await audit('button-hover');
      }
    }
    await page.getByRole('button', { name: 'Fondo y colores', exact: true }).click();
    await page.getByRole('button', { name: 'Editar Fondo páginas', exact: true }).click();
    await audit('color-picker');
    await expect(page.getByRole('button', { name: 'Listo', exact: true })).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`${width}-picker.png`) });
    await page.getByRole('button', { name: 'Listo', exact: true }).click();
    await showSection(page, 'Páginas');
    await page.getByRole('combobox', { name: 'Fotos en página 2' }).click();
    await page.getByRole('option', { name: 'General (3)', exact: true }).hover();
    await audit('select-hover');
    await page.keyboard.press('Escape');
    await showSection(page, 'Artículos');
    await page.getByRole('button', { name: 'Reordenar', exact: true }).click();
    await audit('reorder');
    await page.screenshot({ path: testInfo.outputPath(`${width}-reorder.png`) });
    await page.getByRole('button', { name: 'Volver al editor', exact: true }).click();
    await page.getByRole('button', { name: 'Menú del catálogo' }).click();
    await page.getByRole('menuitem', { name: 'Administración del catálogo' }).hover();
    await audit('menu-hover');
    await page.keyboard.press('Escape');
    await openManagement(page);
    await audit('management');
    await page.getByRole('button', { name: 'Vaciar catálogo', exact: true }).click();
    await audit('confirmation');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('dialog', { name: 'Administración del catálogo' }).getByRole('button', { name: 'Cerrar', exact: true }).click();
    await toggle.click();
    await expect(page.locator('.header-region')).toHaveClass(/light/);
    if (width < 768) await page.getByRole('button', { name: 'Vista previa', exact: true }).click();
    await expect(page.locator('.workspace')).toHaveCSS('background-color', 'rgb(241, 245, 249)');
  });
}
