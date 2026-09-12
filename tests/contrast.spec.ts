import { test, expect } from './fixtures';
import { openApp } from './helpers';

test('editor text, input borders, selection and primary targets meet scoped contrast and size', async ({ page }, testInfo) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  await page.getByRole('button', { name: 'Marca', exact: true }).click();
  await page.getByRole('button', { name: 'Administración del catálogo' }).click();
  const measured = await page.evaluate(() => {
    type RGB = [number, number, number];
    const parse = (color: string) => color.match(/[\d.]+/g)!.map(Number);
    const composite = (foreground: number[], background: RGB): RGB => {
      const alpha = foreground[3] ?? 1;
      return background.map((value, i) => foreground[i] * alpha + value * (1 - alpha)) as RGB;
    };
    const background = (element: Element | null): RGB => {
      if (!element) return [15, 23, 42];
      const style = getComputedStyle(element);
      return composite(parse(style.backgroundColor), background(element.parentElement));
    };
    const luminance = (rgb: RGB) => rgb.map((value) => value / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a: RGB, b: RGB) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
    return Array.from(document.querySelectorAll<HTMLElement>('.sidebar-left input:not([type="file"]), .sidebar-right input:not([type="file"]), .rs-field-label, .sb-btn, .rs-action, .rs-index, .rs-act-del, .rs-tab-btn')).filter((element) => element.getClientRects().length && !(element as HTMLButtonElement).disabled).map((element) => {
      const style = getComputedStyle(element);
      const bg = background(element);
      const text = composite(parse(style.color), bg);
      const border = composite(parse(style.borderTopColor), bg);
      const rect = element.getBoundingClientRect();
      return { name: element.textContent?.trim() || element.getAttribute('aria-label') || element.id, text: ratio(text, bg), border: ratio(border, bg), width: rect.width, height: rect.height, input: element.tagName === 'INPUT', button: element.tagName === 'BUTTON', gradient: style.backgroundImage };
    });
  });
  await testInfo.attach('contrast-and-targets', { body: JSON.stringify(measured, null, 2), contentType: 'application/json' });
  expect(measured.filter((item) => item.gradient === 'none' && item.text < 4.5)).toEqual([]);
  expect(measured.filter((item) => item.input && item.border < 3)).toEqual([]);
  expect(measured.filter((item) => item.button && (item.width < 44 || item.height < 44))).toEqual([]);
});

test('color control is named and can open/close by keyboard with focus restored', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  const swatch = page.getByRole('button', { name: 'Editar Fondo del producto' });
  await swatch.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Fondo del producto' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Listo', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(swatch).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
