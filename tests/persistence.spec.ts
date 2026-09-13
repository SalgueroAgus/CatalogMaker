import { test, expect } from './fixtures';
import { openApp, readyAfterReload, saved, showSection, openManagement } from './helpers';

test('StrictMode hydration gates mutations and allocates each image once', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.products.getState().addProducts([await h.photo()]);
    await h.settings.getState().setBgImage(await h.photo('fondo.png'));
  });
  await page.addInitScript(() => { window.faults.delay = 800; });
  await page.reload();
  await expect(page.getByText('Cargando catálogo…')).toBeVisible();
  await page.evaluate(async () => {
    const path = '/tests/browser-harness.ts';
    window.catalogTest = (await import(path)).harness;
    await window.catalogTest.products.getState().addBlankProduct();
    await window.catalogTest.settings.getState().updateContact('SHOULD NOT SAVE');
    await Promise.all([window.catalogTest.hydrateCatalog(), window.catalogTest.hydrateCatalog()]);
  });
  expect(await page.evaluate(() => ({ count: window.catalogTest.products.getState().products.length, urls: window.faults.created.length, writes: window.faults.writes, reads: window.faults.reads }))).toEqual({ count: 1, urls: 2, writes: 0, reads: 2 });
});

test('failed load stays distinct from empty and retry reads original data', async ({ page }) => {
  await openApp(page, { readFailures: 1 });
  await expect(page.getByRole('button', { name: 'Reintentar carga' })).toBeVisible();
  expect(await page.evaluate(async () => (await window.catalogTest.products.getState().addBlankProduct()).status)).toBe('ignored');
  await page.getByRole('button', { name: 'Reintentar carga' }).click();
  await expect(page.getByRole('button', { name: 'Agregar producto', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.faults.writes)).toBe(2);
});

for (const failure of ['quota', 'abort'] as const) {
  for (const domain of ['metadata', 'photo', 'settings', 'background'] as const) {
    test(`${failure} in ${domain} is atomic, visible, retained and retryable`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await openApp(page);
      const result = await page.evaluate(async ({ failure, domain }) => {
        const h = window.catalogTest;
        await h.products.getState().addProducts([await h.photo()]);
        await h.settings.getState().setBgImage(await h.photo('background.png'));
        const original = await h.dbLoadCatalog();
        const id = h.products.getState().products[0].id;
        const oldURL = h.products.getState().products[0].image;
        window.faults.failure = failure;
        window.faults.failKey = domain === 'metadata' ? 'cm:products' : domain === 'photo' ? 'cm:img:' : domain === 'settings' ? 'cm:settings' : 'cm:bg';
        const result = domain === 'metadata' ? await h.products.getState().updateField(id, 'price', '$987')
          : domain === 'photo' ? await h.products.getState().replaceImage(id, await h.photo('new.png', '#2266dd'))
          : domain === 'settings' ? await h.settings.getState().updateContact('CONTACTO NUEVO')
          : await h.settings.getState().setBgImage(await h.photo('new-bg.png', '#2266dd'));
        const durable = await h.dbLoadCatalog();
        const bytes = async (blob: Blob | null | undefined) => blob ? Array.from(new Uint8Array(await blob.arrayBuffer())) : null;
        return {
          result,
          saving: h.persistence.getState().saving,
          sameMeta: JSON.stringify(original.products) === JSON.stringify(durable.products),
          sameSettings: JSON.stringify(original.settings) === JSON.stringify(durable.settings),
          samePhoto: JSON.stringify(await bytes(original.images.get(id))) === JSON.stringify(await bytes(durable.images.get(id))),
          sameBg: JSON.stringify(await bytes(original.background)) === JSON.stringify(await bytes(durable.background)),
          oldRetained: !window.faults.revoked.includes(oldURL),
          imageDecodes: await Promise.all(h.products.getState().products.map(async (product) => {
            const image = new Image(); image.src = product.image; await image.decode(); return true;
          })),
        };
      }, { failure, domain });
      expect(result).toMatchObject({ result: { status: 'failed' }, saving: 'failed', sameMeta: true, sameSettings: true, samePhoto: true, sameBg: true, oldRetained: true, imageDecodes: [true] });
      await expect(page.getByRole('button', { name: 'Reintentar guardado' }).first()).toBeVisible();
      await page.evaluate(async () => {
        const h = window.catalogTest;
        window.faults.delay = 300;
        const retry = h.retrySave();
        const edit = h.products.getState().updateField(h.products.getState().products[0].id, 'name', 'EDICIÓN POSTERIOR');
        await retry;
        if (h.persistence.getState().saving !== 'saving') throw new Error('Older success hid pending state');
        await edit;
      });
      await saved(page);
      await readyAfterReload(page);
      expect(await page.evaluate(() => window.catalogTest.products.getState().products[0].name)).toBe('EDICIÓN POSTERIOR');
      expect(errors).toEqual([]);
    });
  }
}

test('overlapping edits and pending reload preserve a complete durable catalog', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.products.getState().addProducts([await h.photo()]);
    window.faults.delay = 300;
    const id = h.products.getState().products[0].id;
    const writes = Array.from({ length: 8 }, (_, i) => h.products.getState().updateField(id, 'price', `$${i}`));
    await writes[0];
    if (h.persistence.getState().saving !== 'saving') throw new Error('Premature saved state');
    await Promise.all(writes);
  });
  await saved(page);
  await page.evaluate(() => {
    const h = window.catalogTest;
    window.faults.delay = 5000;
    void h.products.getState().deleteProduct(h.products.getState().products[0].id);
  });
  page.on('dialog', (dialog) => dialog.accept());
  await readyAfterReload(page);
  const state = await page.evaluate(async () => {
    const h = window.catalogTest;
    const data = await h.dbLoadCatalog();
    return { count: data.products.length, images: data.images.size, price: data.products[0]?.price };
  });
  expect([0, 1]).toContain(state.count);
  expect(state.images).toBe(state.count);
  if (state.count) expect(state.price).toBe('$ 7');
});

for (const action of ['products', 'settings', 'everything'] as const) {
  test(`${action} reset is serialized, failure retryable, and isolated after reload`, async ({ page }) => {
    await openApp(page);
    const result = await page.evaluate(async (action) => {
      const h = window.catalogTest;
      await h.products.getState().addProducts([await h.photo()]);
      await h.products.getState().updateField(h.products.getState().products[0].id, 'price', '$456');
      await h.settings.getState().setBgImage(await h.photo('background.png'));
      await h.settings.getState().updateContact('CONTACTO');
      const before = await h.dbLoadCatalog();
      window.faults.delay = 200;
      window.faults.failKey = action === 'settings' ? 'cm:bg' : 'cm:img:';
      const reset = h.manageCatalog(action);
      const repeated = await h.manageCatalog(action);
      const during = await h.products.getState().addBlankProduct();
      const failed = await reset;
      const durable = await h.dbLoadCatalog();
      window.faults.delay = 0;
      await h.retrySave();
      const after = await h.dbLoadCatalog();
      const originalImage = before.images.values().next().value as Blob;
      const nextImage = after.images.values().next().value as Blob | undefined;
      const preservedBytes = nextImage ? JSON.stringify(Array.from(new Uint8Array(await originalImage.arrayBuffer()))) === JSON.stringify(Array.from(new Uint8Array(await nextImage.arrayBuffer()))) : false;
      return { repeated: repeated.status, during: during.status, failed: failed.status, unchangedOnFailure: JSON.stringify(before.products) === JSON.stringify(durable.products) && durable.images.size === 1 && !!durable.background, count: after.products.length, photos: after.images.size, bg: !!after.background, contact: after.settings?.footerContact, preservedMeta: JSON.stringify(before.products) === JSON.stringify(after.products), preservedBytes };
    }, action);
    expect(result).toMatchObject({ repeated: 'ignored', during: 'ignored', failed: 'failed', unchangedOnFailure: true, count: action === 'settings' ? 1 : 0, photos: action === 'settings' ? 1 : 0, bg: action === 'products' });
    if (action === 'settings') expect(result).toMatchObject({ preservedMeta: true, preservedBytes: true });
    if (action === 'products') expect(result.contact).toBe('CONTACTO');
    await page.evaluate(() => window.catalogTest.products.getState().addBlankProduct());
    await readyAfterReload(page);
    expect(await page.evaluate(() => window.catalogTest.products.getState().products.length)).toBe(action === 'settings' ? 2 : 1);
  });
}

test('all management confirmations name catalog and cancellation changes nothing', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(2));
  await openManagement(page);
  const writes = await page.evaluate(() => window.faults.writes);
  const messages: string[] = [];
  for (const name of ['Vaciar catálogo', 'Restablecer ajustes', 'Restablecer todo']) {
    await page.getByRole('button', { name, exact: true }).click();
    messages.push(await page.getByRole('alertdialog').innerText());
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  }
  expect(messages).toHaveLength(3);
  expect(messages.every((message) => message.includes('Principal'))).toBe(true);
  expect(await page.evaluate(() => window.faults.writes)).toBe(writes);
  expect(await page.evaluate(() => window.catalogTest.products.getState().products.length)).toBe(2);
});

test('background tabs retain image; replacements, explicit removal and reset release resources', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.settings.getState().setBgImage(await h.photo());
  });
  await showSection(page, 'Diseño');
  await page.getByRole('button', { name: 'Fondo y colores', exact: true }).click();
  await page.getByRole('tab', { name: 'Color', exact: true }).click();
  await readyAfterReload(page);
  expect(await page.evaluate(() => !!window.catalogTest.settings.getState().bgImage)).toBe(true);
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    for (let i = 0; i < 6; i++) await h.settings.getState().setBgImage(await h.photo(`bg${i}.png`));
    await h.settings.getState().setBgImage(null);
    const data = await h.dbLoadCatalog();
    return { allocated: window.faults.created.length, revoked: window.faults.revoked.length, background: data.background };
  });
  expect(result.allocated).toBe(result.revoked);
  expect(result.background).toBeNull();
  await readyAfterReload(page);
  expect(await page.evaluate(() => window.catalogTest.settings.getState().bgImage)).toBeNull();
});
