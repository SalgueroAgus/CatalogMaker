import { expect, type Page } from '@playwright/test';
import type {} from './browser-harness';

export async function installInstrumentation(page: Page, options: { delay?: number; readFailures?: number } = {}) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' || url.protocol === 'data:' || url.protocol === 'blob:' ? route.continue() : route.abort();
  });
  await page.addInitScript((initial) => {
    window.faults = { failKey: null, failure: 'quota', readFailures: initial.readFailures ?? 0, delay: initial.delay ?? 0, reads: 0, writes: 0, created: [], revoked: [] };
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      window.faults.created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      window.faults.revoked.push(url);
      revoke(url);
    };
    const transact = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args: Parameters<typeof transact>) {
      const faults = window.faults;
      if (args[1] === 'readwrite') faults.writes++;
      else {
        faults.reads++;
        if (faults.readFailures > 0) {
          faults.readFailures--;
          throw new DOMException('Injected read failure', 'UnknownError');
        }
      }
      const tx = transact.apply(this, args);
      if (faults.delay > 0) {
        const until = performance.now() + faults.delay;
        const store = tx.objectStore('keyval');
        const keepAlive = () => {
          if (performance.now() < until) store.get('__test_keepalive__').onsuccess = keepAlive;
        };
        keepAlive();
      }
      return tx;
    };
    const put = IDBObjectStore.prototype.put;
    const remove = IDBObjectStore.prototype.delete;
    function fail(store: IDBObjectStore, key: IDBValidKey | IDBKeyRange | undefined) {
      const logicalKey = String(key).replace(/^cm:catalog:[^:]+:/, 'cm:');
      if (window.faults.failKey && (String(key).startsWith(window.faults.failKey) || logicalKey.startsWith(window.faults.failKey))) {
        window.faults.failKey = null;
        if (window.faults.failure === 'abort') store.transaction.abort();
        throw new DOMException('Injected write failure', window.faults.failure === 'quota' ? 'QuotaExceededError' : 'AbortError');
      }
    }
    IDBObjectStore.prototype.put = function (value, key) {
      fail(this, key);
      return put.call(this, value, key);
    };
    IDBObjectStore.prototype.delete = function (key) {
      fail(this, key);
      return remove.call(this, key);
    };
  }, options);
}

export async function openApp(page: Page, options: { delay?: number; readFailures?: number } = {}) {
  await installInstrumentation(page, options);
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/tests/browser-harness.ts';
    window.catalogTest = (await import(path)).harness;
  });
  if (!options.readFailures) await expect.poll(() => page.evaluate(() => window.catalogTest.persistence.getState().loading)).toBe('ready');
}

export async function readyAfterReload(page: Page) {
  await page.reload();
  await page.evaluate(async () => {
    const path = '/tests/browser-harness.ts';
    window.catalogTest = (await import(path)).harness;
  });
  await expect.poll(() => page.evaluate(() => window.catalogTest.persistence.getState().loading)).toBe('ready');
}

export async function saved(page: Page) {
  await expect.poll(() => page.evaluate(() => window.catalogTest.persistence.getState().saving)).toBe('saved');
}

export async function showSection(page: Page, label: 'Artículos' | 'Páginas' | 'Diseño') {
  if (await page.evaluate(() => window.innerWidth < 768)) await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: label, exact: true }).click();
  else await page.getByRole('tab', { name: label, exact: true }).click();
}

export async function openManagement(page: Page) {
  await page.getByRole('button', { name: 'Menú del catálogo', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Administración del catálogo', exact: true }).click();
}

export async function downloadPDF(page: Page) {
  if (await page.evaluate(() => window.innerWidth < 1024)) {
    await page.getByRole('button', { name: 'Exportar catálogo', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Descargar PDF', exact: true }).click();
  } else await page.getByRole('button', { name: 'Descargar PDF', exact: true }).click();
}

export async function chooseOption(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}
