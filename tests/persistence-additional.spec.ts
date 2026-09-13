import { test, expect } from './fixtures';
import { openApp, readyAfterReload } from './helpers';

for (const action of ['products', 'settings', 'everything'] as const) {
  test(`${action} management waits behind older pending writes and cannot announce saved early`, async ({ page }) => {
    await openApp(page);
    const result = await page.evaluate(async (action) => {
      const h = window.catalogTest;
      await h.fixture(2);
      await h.products.getState().replaceImage(h.products.getState().products[0].id, await h.photo());
      await h.settings.getState().updateContact('KEEP CONTACT');
      window.faults.delay = 250;
      const edit = h.products.getState().updateField(h.products.getState().products[0].id, 'price', '$666');
      const reset = h.manageCatalog(action);
      await edit;
      const intermediate = { saving: h.persistence.getState().saving, managing: h.persistence.getState().managing };
      const completed = await reset;
      window.faults.delay = 0;
      const durable = await h.dbLoadCatalog();
      return { intermediate, completed: completed.status, count: durable.products.length, photoCount: durable.images.size, price: durable.products[0]?.price, contact: durable.settings?.footerContact };
    }, action);
    expect(result.intermediate).toEqual({ saving: 'saving', managing: true });
    expect(result.completed).toBe('saved');
    expect(result.count).toBe(action === 'settings' ? 2 : 0);
    expect(result.photoCount).toBe(action === 'settings' ? 1 : 0);
    if (action === 'settings') expect(result.price).toBe('$ 666');
    if (action === 'products') expect(result.contact).toBe('KEEP CONTACT');
    await readyAfterReload(page);
    expect(await page.evaluate(() => window.catalogTest.products.getState().products.length)).toBe(result.count);
  });
}

test('partially allocated hydration failure releases URLs and retries the same durable records', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const h = window.catalogTest;
    await h.products.getState().addProducts([await h.photo('a.png'), await h.photo('b.png')]);
    await h.settings.getState().setBgImage(await h.photo('bg.png'));
  });
  await page.addInitScript(() => {
    const create = URL.createObjectURL.bind(URL);
    let count = 0;
    URL.createObjectURL = (blob) => {
      if (++count === 2) throw new Error('Injected hydration allocation failure');
      return create(blob);
    };
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reintentar carga' })).toBeVisible();
  expect(await page.evaluate(() => ({ created: window.faults.created.length, revoked: window.faults.revoked.length, writes: window.faults.writes }))).toEqual({ created: 1, revoked: 1, writes: 0 });
  await page.getByRole('button', { name: 'Reintentar carga' }).click();
  await expect(page.locator('.rs-card')).toHaveCount(2);
  const resources = await page.evaluate(async () => {
    const path = '/tests/browser-harness.ts';
    const h = (await import(path)).harness;
    const images = [...h.products.getState().products.map((p: { image: string }) => p.image), h.settings.getState().bgImage];
    for (const url of images) { const img = new Image(); img.src = url; await img.decode(); }
    const durable = await h.dbLoadCatalog();
    return { active: images.every((url) => !window.faults.revoked.includes(url)), products: durable.products.length, photos: durable.images.size, writes: window.faults.writes };
  });
  expect(resources).toEqual({ active: true, products: 2, photos: 2, writes: 0 });
});

test('export lease prevents mutation allocations and releases after success', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.catalogTest.fixture(2));
  const result = await page.evaluate(async () => {
    const h = window.catalogTest;
    const photo = await h.photo();
    const before = window.faults.created.length;
    const exporting = h.output('pdf');
    const replacement = await h.products.getState().replaceImage(h.products.getState().products[0].id, photo);
    const reset = await h.manageCatalog('everything');
    const intake = await h.products.getState().addProducts([photo]);
    const gated = { replacement: replacement.status, reset: reset.status, intake: intake.status, allocations: window.faults.created.length - before };
    await exporting;
    const after = await h.products.getState().replaceImage(h.products.getState().products[0].id, photo);
    return { ...gated, after: after.status, exporting: h.persistence.getState().exporting };
  });
  expect(result).toEqual({ replacement: 'ignored', reset: 'ignored', intake: 'ignored', allocations: 0, after: 'saved', exporting: false });
});
