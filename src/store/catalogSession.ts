import { dbLoadCatalog, dbSaveCatalog, type StoredCatalog } from '../db';
import { PLACEHOLDER_IMG } from '../utils/image';
import { useProductStore } from './useProductStore';
import { DEFAULT_STATE, useSettingsStore } from './useSettingsStore';
import { usePersistenceStore, type MutationResult } from './usePersistenceStore';

interface SessionSnapshot {
  data: StoredCatalog;
  urls: Set<string>;
}

const resources = new Map<string, Blob>();
const pending = new Set<SessionSnapshot>();
const exports = new Set<Set<string>>();
let durable: SessionSnapshot | null = null;
let hydration: Promise<void> | null = null;
let queue: Promise<MutationResult> = Promise.resolve({ status: 'ignored' });

export function canMutate(): boolean {
  const state = usePersistenceStore.getState();
  return state.loading === 'ready' && !state.managing && !state.exporting;
}

export function createImageResource(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  resources.set(url, blob);
  return url;
}

function activeUrls(): Set<string> {
  const urls = new Set(useProductStore.getState().products.map((p) => p.image));
  const bg = useSettingsStore.getState().bgImage;
  if (bg) urls.add(bg);
  return urls;
}

function collectResources() {
  const retained = activeUrls();
  for (const snapshot of [...pending, ...(durable ? [durable] : [])]) {
    for (const url of snapshot.urls) retained.add(url);
  }
  for (const owner of exports) for (const url of owner) retained.add(url);
  for (const url of resources.keys()) {
    if (!retained.has(url)) {
      URL.revokeObjectURL(url);
      resources.delete(url);
    }
  }
}

function captureState(): SessionSnapshot {
  const products = useProductStore.getState().products;
  const { storeName, footerContact, footerTag, colors, fonts, fontSizes, bgImage, bgImageOpacity, itemsPerPage, pageLayouts, pageItemCounts } = useSettingsStore.getState();
  const images = new Map<string, Blob>();
  for (const product of products) {
    const blob = resources.get(product.image);
    if (blob) images.set(product.id, blob);
  }
  return {
    urls: activeUrls(),
    data: {
      products: products.map(({ image: _image, ...meta }) => meta),
      settings: { storeName, footerContact, footerTag, colors, fonts, fontSizes, bgImageOpacity, itemsPerPage, pageLayouts, pageItemCounts },
      images,
      background: bgImage ? resources.get(bgImage) ?? null : null,
    },
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') return 'No hay espacio suficiente en este navegador. Liberá espacio y reintentá.';
  return error instanceof Error ? error.message : 'No se pudo guardar en este navegador. Reintentá.';
}

export function hydrateCatalog(): Promise<void> {
  if (hydration) return hydration;
  if (usePersistenceStore.getState().loading === 'ready') return Promise.resolve();
  usePersistenceStore.setState({ loading: 'loading', error: null });
  hydration = (async () => {
    const allocated: string[] = [];
    try {
      const data = await dbLoadCatalog();
      const adopt = (blob: Blob) => {
        const url = createImageResource(blob);
        allocated.push(url);
        return url;
      };
      const products = data.products.map((p) => ({ ...p, image: data.images.has(p.id) ? adopt(data.images.get(p.id)!) : PLACEHOLDER_IMG }));
      const background = data.background ? adopt(data.background) : null;
      useSettingsStore.getState().hydrateSettings(data.settings ?? DEFAULT_STATE, background);
      useProductStore.getState().hydrateProducts(products);
      durable = { data, urls: new Set(allocated) };
      usePersistenceStore.setState({ loading: 'ready', saving: 'saved', error: null });
    } catch (error) {
      for (const url of allocated) {
        URL.revokeObjectURL(url);
        resources.delete(url);
      }
      usePersistenceStore.setState({ loading: 'failed', error: errorMessage(error) });
    } finally {
      hydration = null;
    }
  })();
  return hydration;
}

function saveCurrentState(): Promise<MutationResult> {
  const snapshot = captureState();
  const revision = usePersistenceStore.getState().revision + 1;
  pending.add(snapshot);
  usePersistenceStore.setState({ revision, saving: 'saving', error: null });
  queue = queue.then(async (): Promise<MutationResult> => {
    try {
      if (!durable) throw new Error('El catálogo todavía no terminó de cargar.');
      await dbSaveCatalog(snapshot.data, durable.data);
      durable = snapshot;
      usePersistenceStore.setState({ savedRevision: revision });
      if (usePersistenceStore.getState().revision === revision) usePersistenceStore.setState({ saving: 'saved', error: null });
      return { status: 'saved' };
    } catch (error) {
      const message = errorMessage(error);
      if (usePersistenceStore.getState().revision === revision) usePersistenceStore.setState({ saving: 'failed', error: message });
      return { status: 'failed', error: message };
    } finally {
      pending.delete(snapshot);
      collectResources();
    }
  });
  return queue;
}

export function mutateCatalog(change: () => void): Promise<MutationResult> {
  if (!canMutate()) return Promise.resolve({ status: 'ignored' });
  change();
  return saveCurrentState();
}

export function retrySave(): Promise<MutationResult> {
  if (!canMutate()) return Promise.resolve({ status: 'ignored' });
  return saveCurrentState();
}

export function manageCatalog(action: 'products' | 'settings' | 'everything'): Promise<MutationResult> {
  if (!canMutate()) return Promise.resolve({ status: 'ignored' });
  usePersistenceStore.setState({ managing: true });
  if (action !== 'settings') useProductStore.getState().hydrateProducts([]);
  if (action !== 'products') useSettingsStore.getState().hydrateSettings(DEFAULT_STATE, null);
  return saveCurrentState().finally(() => usePersistenceStore.setState({ managing: false }));
}

export function acquireExport(): (() => void) | null {
  const state = usePersistenceStore.getState();
  if (state.loading !== 'ready' || state.managing || state.exporting) return null;
  const urls = activeUrls();
  exports.add(urls);
  usePersistenceStore.setState({ exporting: true });
  return () => {
    exports.delete(urls);
    usePersistenceStore.setState({ exporting: false });
    collectResources();
  };
}
