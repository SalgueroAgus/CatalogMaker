import { test, expect } from './fixtures';
import { openApp } from './helpers';

test('secondary controls expose selection and meet text, state and target measurements', async ({ page }, testInfo) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(5, 3));
  await page.getByRole('button', { name: 'Página', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Imagen', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Imagen', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Páginas', exact: true }).click();
  await expect(page.locator('.paginas-pill.active')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.gsp-btn.active').first()).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running' && animation.effect?.getComputedTiming().iterations !== Infinity).length)).toBe(0);
  const measurements = await page.evaluate(() => {
    type RGB = [number, number, number];
    const parse = (value: string) => value.match(/[\d.]+/g)!.map(Number);
    const blend = (foreground: number[], background: RGB): RGB => background.map((channel, i) => foreground[i] * (foreground[3] ?? 1) + channel * (1 - (foreground[3] ?? 1))) as RGB;
    const backgrounds = (element: Element | null): RGB[] => {
      if (!element) return [[15, 23, 42]];
      const style = getComputedStyle(element);
      const parents = backgrounds(element.parentElement);
      const solid = parents.map((color) => blend(parse(style.backgroundColor), color));
      const stops = style.backgroundImage.match(/rgba?\([^)]+\)/g);
      return stops ? solid.flatMap((color) => stops.map((stop) => blend(parse(stop), color))) : solid;
    };
    const lum = (rgb: RGB) => rgb.map((c) => c / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a: RGB, b: RGB) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    return Array.from(document.querySelectorAll<HTMLElement>('.sb-accordion-header, .typo-role-header, .typo-role-name, .sb-label, .sb-subsection-label, .sb-opacity-label, .sb-opacity-value, .sb-fondo-tab, .sb-bg-upload, .sb-opacity-slider, .paginas-pill, .gsp-btn, .gsp-label, .paginas-page-label')).filter((element) => element.getClientRects().length).map((element) => {
      const style = getComputedStyle(element);
      const backgroundsAtElement = backgrounds(element);
      const rect = element.getBoundingClientRect();
      return { ownText: Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim()), name: element.textContent?.trim() || element.getAttribute('aria-label'), text: Math.min(...backgroundsAtElement.map((bg) => ratio(blend(parse(style.color), bg), bg))), border: Math.min(...backgroundsAtElement.map((bg) => ratio(blend(parse(style.borderTopColor), bg), bg))), target: ['BUTTON', 'INPUT'].includes(element.tagName), width: rect.width, height: rect.height, state: element.classList.contains('active') && element.classList.contains('gsp-btn'), slider: element.tagName === 'INPUT' };
    });
  });
  await testInfo.attach('secondary-controls', { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' });
  expect(measurements.filter((control) => control.ownText && control.text < 4.5)).toEqual([]);
  expect(measurements.filter((control) => control.state && control.border < 3)).toEqual([]);
  expect(measurements.filter((control) => control.target && (control.width < 24 || control.height < 24))).toEqual([]);
});

test('open color controls remain reachable after viewport height changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(3));
  await page.getByRole('button', { name: 'Productos', exact: true }).click();
  await page.locator('.rs-card').last().getByRole('button', { name: 'Detalles', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Fondo del producto' }).last().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 360 });
  await expect(page.getByRole('button', { name: 'Listo', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
