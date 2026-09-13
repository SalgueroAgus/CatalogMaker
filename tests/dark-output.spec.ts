import { test, expect } from './fixtures';
import { writeFile } from 'node:fs/promises';
import { openApp, showSection, downloadPDF } from './helpers';

function pdfImageStreams(base64: string) {
  return [...Buffer.from(base64, 'base64').toString('latin1').matchAll(/\/Subtype \/Image[\s\S]*?stream\r?\n([\s\S]*?)\r?\nendstream/g)].map((match) => Buffer.from(match[1], 'latin1').toString('base64'));
}

for (const width of [390, 1440]) {
  test(`theme preserves A4 preview, PDF images, HTML and printing at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: width < 768 ? 1000 : 1600 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openApp(page);
    await page.evaluate(async () => {
      const h = window.catalogTest;
      await h.fixture(2, 3);
      await h.settings.getState().updateColor('bg', '#f8ead8');
      await h.settings.getState().updateColor('name', '#5a1830');
      await h.settings.getState().setBgImage(await h.photo('background.png', '#2060b0'));
      await h.settings.getState().setBgImageOpacity(0.3);
      const product = h.products.getState().products[0];
      await h.products.getState().replaceImage(product.id, await h.photo());
      await h.products.getState().updateField(product.id, 'bgColor', 'rgba(255,255,255,0)');
    });
    const sheet = page.locator('.workspace .page-a4').last();
    await sheet.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const screenshotStyle = '.workspace { background: #f1f5f9 !important; } .back-to-top { visibility: hidden !important; }';
    const preview = await sheet.screenshot({ style: screenshotStyle, path: testInfo.outputPath('light-preview.png') });
    const lightPDF = await page.evaluate(() => window.catalogTest.output('pdf'));
    const lightHTML = await page.evaluate(() => window.catalogTest.output('html'));
    await page.getByRole('switch', { name: 'Modo oscuro' }).click();
    await sheet.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const darkPreview = await sheet.screenshot({ style: screenshotStyle, path: testInfo.outputPath('dark-preview.png') });
    const comparison = await page.evaluate(async ({ light, dark }) => {
      const decode = async (data: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const a = await decode(light);
      const b = await decode(dark);
      return { sameSize: a.width === b.width && a.height === b.height, maxChannelDifference: a.data.reduce((max, value, i) => Math.max(max, Math.abs(value - b.data[i])), 0) };
    }, { light: preview.toString('base64'), dark: darkPreview.toString('base64') });
    expect(comparison.sameSize).toBe(true);
    expect(comparison.maxChannelDifference).toBeLessThanOrEqual(1);
    await expect(sheet).toHaveCSS('color-scheme', 'light only');
    const darkPDF = await page.evaluate(() => window.catalogTest.output('pdf'));
    const darkHTML = await page.evaluate(() => window.catalogTest.output('html'));
    expect(pdfImageStreams(lightPDF)).toHaveLength(2);
    expect(pdfImageStreams(darkPDF)).toEqual(pdfImageStreams(lightPDF));
    expect(darkHTML).toBe(lightHTML);
    await writeFile(testInfo.outputPath('dark.pdf'), Buffer.from(darkPDF, 'base64'));
    await writeFile(testInfo.outputPath('dark.html'), darkHTML);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.workspace')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(sheet).toHaveCSS('background-color', 'rgb(248, 234, 216)');
    await expect(page.locator('.header-region')).toBeHidden();
    await page.emulateMedia({ media: 'screen' });
    await showSection(page, 'Diseño');
    const download = page.waitForEvent('download');
    await downloadPDF(page);
    await (await download).saveAs(testInfo.outputPath('dark-from-editor.pdf'));
    await expect(page.locator('.catalog-capture')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/pdf-exporting/);
  });
}
