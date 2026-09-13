import { test, expect } from './fixtures';
import { openApp, readyAfterReload, saved, showSection, chooseOption } from './helpers';

test('integer price editing, validation, legacy normalization and import', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  const price = page.locator('.rs-input-price input');
  await price.fill('1234567');
  await price.press('Tab');
  await expect(price).toHaveValue('$ 1.234.567');
  await expect(page.locator('.cell-price')).toHaveValue('$ 1.234.567');
  await price.fill('12,50');
  await price.press('Tab');
  await expect(price).toHaveAttribute('aria-invalid', 'true');
  expect(await page.evaluate(() => window.catalogTest.products.getState().products[0].price)).toBe('$ 1.234.567');
  await price.fill('');
  await price.press('Tab');
  await saved(page);
  await readyAfterReload(page);
  await expect(price).toHaveValue('');
  const results = await page.evaluate(async () => {
    const path = '/src/utils/price.ts';
    const { normalizeLegacyPrice } = await import(path);
    const values = ['1234,50', '$0.00', '1.234,49', 'Consultar', '1,234.56'].map(normalizeLegacyPrice);
    const rejected = await window.catalogTest.products.getState().importProducts([{ name: 'BAD', price: '1,50', description: '' }], []);
    const accepted = await window.catalogTest.products.getState().importProducts([{ name: 'GOOD', price: '1.234', description: '' }], []);
    return { values, rejected, accepted };
  });
  expect(results.values).toEqual(['$ 1.235', '$ 0', '$ 1.234', 'Consultar', '1,234.56']);
  expect(results.rejected.status).toBe('invalid');
  expect(results.accepted.status).toBe('saved');
});

test('footer URLs and index controls persist independently', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(31));
  await showSection(page, 'Diseño');
  const url = page.getByRole('textbox', { name: 'Enlace del pie (opcional)', exact: true });
  await url.fill('example.com/?a=1&b=2');
  await url.press('Tab');
  await expect(url).toHaveValue('https://example.com/?a=1&b=2');
  await expect(page.locator('.workspace a.footer-tag')).toHaveCount(13);
  await url.fill('javascript:alert(1)');
  await expect(page.locator('.workspace a.footer-tag')).toHaveCount(0);
  await url.fill('https://example.com/');
  await page.getByRole('button', { name: 'Fondo y colores', exact: true }).click();
  await chooseOption(page, 'Fondo del índice', 'Solo color');
  await page.evaluate(async () => {
    const s = window.catalogTest.settings.getState();
    await s.setIndexBgColor('#ff0000');
    await s.updateColor('productInfoBg', '#00ff00');
    await s.updateColor('bg', '#0000ff');
  });
  await expect(page.locator('[data-page-kind="index"]').first()).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  await expect(page.locator('.cell-info').first()).toHaveCSS('background-color', 'rgb(0, 255, 0)');
  await saved(page);
  await readyAfterReload(page);
  await expect(page.locator('[data-page-kind="index"]').nth(1)).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  await expect(page.locator('.cell-info').first()).toHaveCSS('background-color', 'rgb(0, 255, 0)');
});

test('index image ownership survives failed replacement and reset', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(1));
  const first = await page.evaluate(async () => {
    await window.catalogTest.settings.getState().setIndexBgImage(await window.catalogTest.photo());
    return window.catalogTest.settings.getState().indexBgImage!;
  });
  await page.evaluate(async () => {
    window.faults.failKey = 'cm:index-bg';
    await window.catalogTest.settings.getState().setIndexBgImage(await window.catalogTest.photo('other.png', '#0000ff'));
  });
  expect(await page.evaluate((url) => window.faults.revoked.includes(url), first)).toBe(false);
  await page.evaluate(() => window.catalogTest.retrySave());
  expect(await page.evaluate((url) => window.faults.revoked.includes(url), first)).toBe(true);
  await readyAfterReload(page);
  expect(await page.evaluate(async () => (await window.catalogTest.dbLoadCatalog()).indexBackground instanceof Blob)).toBe(true);
  await page.evaluate(() => window.catalogTest.settings.getState().setIndexBgImage(null));
  expect(await page.evaluate(async () => (await window.catalogTest.dbLoadCatalog()).indexBackground)).toBeNull();
  await page.evaluate(async () => {
    await window.catalogTest.settings.getState().setIndexBgImage(await window.catalogTest.photo());
    await window.catalogTest.settings.getState().resetSettings();
  });
  expect(await page.evaluate(async () => (await window.catalogTest.dbLoadCatalog()).indexBackground)).toBeNull();
});

test('scroll follows matching articles in both directions without feedback', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(40, 1));
  await page.waitForTimeout(1200);
  await page.locator('.workspace').evaluate((node) => {
    const cell = node.querySelectorAll<HTMLElement>('.product-cell')[12];
    node.scrollTop += cell.getBoundingClientRect().top - node.getBoundingClientRect().top;
  });
  await expect.poll(() => page.locator('.articles-content').evaluate((node) => {
    const card = node.querySelectorAll('.rs-product-card')[12].getBoundingClientRect();
    const bounds = node.getBoundingClientRect();
    return card.top >= bounds.top - 1 && card.bottom <= bounds.bottom + 1;
  })).toBe(true);
  await page.locator('.articles-content').evaluate((node) => {
    node.dispatchEvent(new Event('wheel'));
    const card = node.querySelectorAll('.rs-product-card')[24];
    node.scrollTop += card.getBoundingClientRect().top - node.getBoundingClientRect().top;
  });
  await expect.poll(() => page.locator('.workspace').evaluate((node) => {
    const cell = node.querySelectorAll('.product-cell')[24].getBoundingClientRect();
    const bounds = node.getBoundingClientRect();
    return cell.bottom > bounds.top && cell.top < bounds.bottom;
  })).toBe(true);
  const top = await page.locator('.workspace').evaluate((node) => node.scrollTop);
  await page.waitForTimeout(400);
  expect(await page.locator('.workspace').evaluate((node) => node.scrollTop)).toBe(top);
});

test('captured index background and footer links match preview', async ({ page }) => {
  test.setTimeout(120000);
  await openApp(page);
  await page.evaluate(async () => {
    await window.catalogTest.fixture(1);
    const s = window.catalogTest.settings.getState();
    await s.setBgImage(await window.catalogTest.photo('global.png', '#0000ff'));
    await s.setBgImageOpacity(1);
    await s.setIndexBgImage(await window.catalogTest.photo('index.png', '#ff0000'));
    await s.setIndexBgImageOpacity(1);
    await s.updateFooterTagUrl('https://example.com/?a=1&b="test"');
  });
  const result = await page.evaluate(async () => {
    const html = await window.catalogTest.output('html');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const colors = [];
    for (const image of Array.from(doc.querySelectorAll<HTMLImageElement>('img.pg'))) {
      const img = new Image(); img.src = image.src; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
      colors.push(Array.from(ctx.getImageData(80, 80, 1, 1).data).slice(0, 3));
    }
    const pdf = atob(await window.catalogTest.output('pdf'));
    return { colors, links: Array.from(doc.querySelectorAll('.pg-link')).map((a) => a.getAttribute('href')), pdfLinks: pdf.includes('/URI (https://example.com/'), externalTargets: Array.from(doc.querySelectorAll('.pg-link[href^="https:"]')).map((a) => a.getAttribute('target')) };
  });
  expect(result.colors[0][0]).toBeGreaterThan(240);
  expect(result.colors[0][2]).toBeLessThan(20);
  expect(result.colors[1][2]).toBeGreaterThan(240);
  expect(result.links.filter((url) => url?.startsWith('https://example.com/'))).toHaveLength(2);
  expect(result.pdfLinks).toBe(true);
  expect(result.externalTargets).toEqual(['_blank', '_blank']);
});

test('legacy prices and text-box color migrate without hydration writes', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    await window.catalogTest.fixture(3);
    const data = await window.catalogTest.dbLoadCatalog();
    const settings = JSON.parse(JSON.stringify(data.settings));
    delete settings.colors.productInfoBg;
    settings.colors.bg = '#123456';
    const products = data.products.map((p, i) => ({ ...p, price: ['1234,50', 'Consultar', '1,234.56'][i] }));
    const request = indexedDB.open('keyval-store');
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
    const tx = db.transaction('keyval', 'readwrite');
    tx.objectStore('keyval').put(settings, `cm:catalog:${window.catalogTest.catalogs.getState().activeId}:settings`);
    tx.objectStore('keyval').put(products, `cm:catalog:${window.catalogTest.catalogs.getState().activeId}:products`);
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
    db.close();
  });
  await readyAfterReload(page);
  expect(await page.evaluate(() => window.faults.writes)).toBe(0);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.map((p) => p.price))).toEqual(['$ 1.235', 'Consultar', '1,234.56']);
  await expect(page.locator('.cell-info').first()).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await page.evaluate(() => window.catalogTest.settings.getState().updateColor('bg', '#ffffff'));
  await expect(page.locator('.cell-info').first()).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  expect(await page.evaluate(async () => (await window.catalogTest.dbLoadCatalog()).products[0].price)).toBe('$ 1.235');
});

test('scroll respects filters, focused fields, inactive panels and mobile', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(30, 3));
  await page.waitForTimeout(1200);
  await page.getByRole('searchbox', { name: 'Buscar artículos' }).fill('PRODUCTO 001');
  const name = page.locator('.rs-input-name textarea');
  await name.focus();
  const listTop = await page.locator('.articles-content').evaluate((node) => node.scrollTop);
  await page.locator('.workspace').evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await page.waitForTimeout(150);
  await expect(name).toBeFocused();
  expect(await page.locator('.articles-content').evaluate((node) => node.scrollTop)).toBe(listTop);
  await showSection(page, 'Diseño');
  await page.locator('.workspace').evaluate((node) => { node.scrollTop = 0; });
  await page.waitForTimeout(150);
  expect(await page.locator('.articles-content').evaluate((node) => node.scrollTop)).toBe(listTop);
  await page.setViewportSize({ width: 390, height: 844 });
  await showSection(page, 'Artículos');
  await page.getByRole('searchbox', { name: 'Buscar artículos' }).fill('');
  await page.locator('.articles-content').evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await page.waitForTimeout(150);
  expect(await page.locator('.workspace').evaluate((node) => node.scrollTop)).toBe(0);
});
