import { CatalogConflictError, dbInitializeCatalogs, dbReadLibrary, dbLoadCatalogRecord, dbSaveCatalog, dbCreateCatalog, dbSelectCatalog, dbUpdateCatalog } from '../db';
import type { CatalogMetadata, CatalogRecord, StoredCatalog } from '../types/catalog';
import { useCatalogStore } from './useCatalogStore';
import { availableCatalogName } from '../utils/catalog';
import { PLACEHOLDER_IMG } from '../utils/image';
import { useProductStore } from './useProductStore';
import { DEFAULT_STATE, useSettingsStore } from './useSettingsStore';
import { usePersistenceStore, type MutationResult } from './usePersistenceStore';

interface SessionSnapshot {
  data: StoredCatalog;
  urls: Set<string>;
  catalogId: string;
  epoch: number;
}

const resources = new Map<string, Blob>();
const pending = new Set<SessionSnapshot>();
const exports = new Set<Set<string>>();
let durable: SessionSnapshot | null = null;
let durableMetadata: CatalogMetadata | null = null;
let hydration: Promise<void> | null = null;
let queue: Promise<MutationResult> = Promise.resolve({ status: 'ignored' });

export function canMutate(): boolean {
  const state = usePersistenceStore.getState();
  return state.loading === 'ready' && state.saving !== 'conflict' && !state.managing && !state.exporting;
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
  const indexBg = useSettingsStore.getState().indexBgImage;
  if (indexBg) urls.add(indexBg);
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
  const { storeName, footerContact, footerTag, footerTagUrl, indexBackgroundMode, indexBgColor, indexBgImageOpacity, colors, fonts, fontSizes, bgImage, indexBgImage, bgImageOpacity, itemsPerPage, pageLayouts, pageItemCounts } = useSettingsStore.getState();
  const images = new Map<string, Blob>();
  for (const product of products) {
    const blob = resources.get(product.image);
    if (blob) images.set(product.id, blob);
  }
  return {
    catalogId: useCatalogStore.getState().activeId,
    epoch: useCatalogStore.getState().epoch,
    urls: activeUrls(),
    data: {
      products: products.map(({ image: _image, ...meta }) => meta),
      settings: { storeName, footerContact, footerTag, footerTagUrl, indexBackgroundMode, indexBgColor, indexBgImageOpacity, colors, fonts, fontSizes, bgImageOpacity, itemsPerPage, pageLayouts, pageItemCounts },
      images,
      indexBackground: indexBgImage ? resources.get(indexBgImage) ?? null : null,
      background: bgImage ? resources.get(bgImage) ?? null : null,
    },
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') return 'No hay espacio suficiente en este navegador. Liberá espacio y reintentá.';
  return error instanceof Error ? error.message : 'No se pudo guardar en este navegador. Reintentá.';
}

function prepareCatalog(record: CatalogRecord) {
  const allocated = new Set<string>();
  const adopt = (blob: Blob) => {
    const url = createImageResource(blob);
    allocated.add(url);
    return url;
  };
  try {
    const products = record.data.products.map((p) => ({ ...p, image: record.data.images.has(p.id) ? adopt(record.data.images.get(p.id)!) : PLACEHOLDER_IMG }));
    const background = record.data.background ? adopt(record.data.background) : null;
    const indexBackground = record.data.indexBackground ? adopt(record.data.indexBackground) : null;
    return { record, products, background, indexBackground, allocated };
  } catch (error) {
    releasePrepared(allocated);
    throw error;
  }
}

function releasePrepared(allocated: Set<string>) {
  for (const url of allocated) { URL.revokeObjectURL(url); resources.delete(url); }
}

function adoptCatalog(prepared: ReturnType<typeof prepareCatalog>) {
  const { record, products, background, indexBackground, allocated } = prepared;
  useSettingsStore.getState().hydrateSettings(record.data.settings ?? DEFAULT_STATE, background, indexBackground);
  useProductStore.getState().hydrateProducts(products);
  const epoch = useCatalogStore.getState().epoch + 1;
  durable = { data: record.data, urls: allocated, catalogId: record.metadata.id, epoch };
  durableMetadata = record.metadata;
  useCatalogStore.setState({ activeId: record.metadata.id, epoch });
  updateMetadata(record.metadata);
  usePersistenceStore.setState({ loading: 'ready', saving: 'saved', revision: 0, savedRevision: 0, error: null });
  collectResources();
}

function updateMetadata(meta: CatalogMetadata | null, removedId?: string) {
  useCatalogStore.setState((state) => ({ catalogs: [...state.catalogs.filter((item) => item.id !== (meta?.id ?? removedId)), ...(meta ? [meta] : [])] }));
}

export function hydrateCatalog(): Promise<void> {
  if (hydration) return hydration;
  if (usePersistenceStore.getState().loading === 'ready') return Promise.resolve();
  usePersistenceStore.setState({ loading: 'loading', error: null });
  hydration = (async () => {
    let prepared: ReturnType<typeof prepareCatalog> | null = null;
    try {
      const library = await dbInitializeCatalogs();
      const id = library.catalogs.some((item) => item.id === library.registry.lastActiveId && !item.deletedAt) ? library.registry.lastActiveId : library.registry.mainId;
      prepared = prepareCatalog(await dbLoadCatalogRecord(id));
      useCatalogStore.setState({ catalogs: library.catalogs, mainId: library.registry.mainId });
      adoptCatalog(prepared);
    } catch (error) {
      if (prepared) releasePrepared(prepared.allocated);
      usePersistenceStore.setState({ loading: 'failed', error: errorMessage(error) });
    } finally { hydration = null; }
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
      if (!durable || !durableMetadata || durable.catalogId !== snapshot.catalogId || durable.epoch !== snapshot.epoch) return { status: 'ignored' };
      if (usePersistenceStore.getState().saving === 'conflict') throw new CatalogConflictError();
      const meta = await dbSaveCatalog(snapshot.catalogId, snapshot.data, durable.data, durableMetadata.revision);
      durable = snapshot;
      durableMetadata = meta;
      updateMetadata(meta);
      announceChange();
      usePersistenceStore.setState({ savedRevision: revision });
      if (usePersistenceStore.getState().revision === revision) usePersistenceStore.setState({ saving: 'saved', error: null });
      return { status: 'saved' };
    } catch (error) {
      const message = errorMessage(error);
      const conflict = error instanceof CatalogConflictError;
      if (conflict || usePersistenceStore.getState().revision === revision) usePersistenceStore.setState({ saving: conflict ? 'conflict' : 'failed', error: message });
      return { status: conflict ? 'conflict' : 'failed', error: message };
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

const priceDrafts = new Set<() => boolean>();
let channel: BroadcastChannel | null = null;

export function registerPriceDraft(commit: () => boolean): () => void {
  priceDrafts.add(commit);
  return () => { priceDrafts.delete(commit); };
}

function announceChange() { channel?.postMessage('changed'); }

export async function refreshCatalogs(): Promise<void> {
  const epoch = useCatalogStore.getState().epoch;
  const revision = durableMetadata?.revision;
  const library = await dbReadLibrary();
  if (useCatalogStore.getState().epoch !== epoch || durableMetadata?.revision !== revision) return;
  useCatalogStore.setState({ catalogs: library.catalogs, mainId: library.registry.mainId });
  const current = library.catalogs.find((item) => item.id === useCatalogStore.getState().activeId);
  const state = usePersistenceStore.getState();
  if (!state.managing && state.saving !== 'saving' && durableMetadata && (!current || current.deletedAt || current.revision !== durableMetadata.revision)) {
    usePersistenceStore.setState({ saving: 'conflict', error: new CatalogConflictError().message });
  }
}

export function watchCatalogs(): () => void {
  const refresh = () => {
    if (usePersistenceStore.getState().loading !== 'ready') return;
    void queue.then(() => refreshCatalogs()).catch((error: unknown) => useCatalogStore.setState({ operationError: errorMessage(error) }));
  };
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('catalogmaker-catalogs');
    channel.onmessage = refresh;
  }
  window.addEventListener('focus', refresh);
  const visible = () => { if (document.visibilityState === 'visible') refresh(); };
  document.addEventListener('visibilitychange', visible);
  return () => { channel?.close(); channel = null; window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', visible); };
}

async function catalogOperation(action: () => Promise<void>, requireSaved = true): Promise<MutationResult> {
  const state = usePersistenceStore.getState();
  if (state.loading !== 'ready' || state.managing || state.exporting) return { status: 'ignored' };
  useCatalogStore.setState({ operationError: null });
  if (requireSaved) {
    let valid = true;
    for (const commit of priceDrafts) if (!commit()) valid = false;
    if (!valid) {
      const error = 'Corregí el precio en edición antes de cambiar de catálogo.';
      useCatalogStore.setState({ operationError: error });
      return { status: 'invalid', error };
    }
  }
  usePersistenceStore.setState({ managing: true });
  try {
    await queue;
    if (requireSaved && usePersistenceStore.getState().saving !== 'saved') throw new Error('Guardá los cambios o resolvé el conflicto antes de continuar. Podés descargar un respaldo del borrador.');
    await action();
    announceChange();
    return { status: 'saved' };
  } catch (error) {
    const message = errorMessage(error);
    useCatalogStore.setState({ operationError: message });
    return { status: error instanceof CatalogConflictError ? 'conflict' : 'failed', error: message };
  } finally {
    usePersistenceStore.setState({ managing: false });
    collectResources();
  }
}

async function openRecord(record: CatalogRecord) {
  const prepared = prepareCatalog(record);
  try {
    await dbSelectCatalog(record.metadata.id, record.metadata.revision);
    adoptCatalog(prepared);
  } catch (error) { releasePrepared(prepared.allocated); throw error; }
}

export function openCatalog(id: string): Promise<MutationResult> {
  return catalogOperation(async () => { await openRecord(await dbLoadCatalogRecord(id)); });
}

export function reloadCurrentCatalog(): Promise<MutationResult> {
  return catalogOperation(async () => {
    const library = await dbReadLibrary();
    const id = library.catalogs.some((item) => item.id === useCatalogStore.getState().activeId && !item.deletedAt) ? useCatalogStore.getState().activeId : library.registry.mainId;
    await openRecord(await dbLoadCatalogRecord(id));
    useCatalogStore.setState({ catalogs: library.catalogs });
  }, false);
}

async function createAndOpen(name: string, data: StoredCatalog) {
  const id = crypto.randomUUID();
  const prepared = prepareCatalog({ metadata: { id, name, createdAt: '', lastSavedAt: '', revision: 1, productCount: data.products.length, deletedAt: null }, data });
  try {
    prepared.record.metadata = await dbCreateCatalog(id, name, data);
    adoptCatalog(prepared);
  } catch (error) { releasePrepared(prepared.allocated); throw error; }
}

export function createCatalog(name: string, sourceId?: string): Promise<MutationResult> {
  return catalogOperation(async () => {
    const data: StoredCatalog = sourceId ? (sourceId === useCatalogStore.getState().activeId ? captureState().data : (await dbLoadCatalogRecord(sourceId)).data)
      : { products: [], settings: DEFAULT_STATE, images: new Map(), background: null, indexBackground: null };
    await createAndOpen(name, data);
  });
}

export function retainConflictCopy(): Promise<MutationResult> {
  return catalogOperation(async () => {
    const library = await dbReadLibrary();
    const current = durableMetadata?.name ?? 'Catálogo';
    const name = availableCatalogName(`Copia de ${current}`, library.catalogs.filter((item) => !item.deletedAt).map((item) => item.name));
    await createAndOpen(name, captureState().data);
  }, false);
}

export function restoreBackup(name: string, data: StoredCatalog): Promise<MutationResult> {
  return catalogOperation(() => createAndOpen(name, data));
}

export function changeCatalog(id: string, action: 'rename' | 'delete' | 'restore' | 'purge', name?: string): Promise<MutationResult> {
  return catalogOperation(async () => {
    const current = useCatalogStore.getState().catalogs.find((item) => item.id === id);
    if (!current) throw new CatalogConflictError();
    let fallback: ReturnType<typeof prepareCatalog> | null = null;
    if (action === 'delete' && id === useCatalogStore.getState().activeId) fallback = prepareCatalog(await dbLoadCatalogRecord(useCatalogStore.getState().mainId));
    try {
      const expectedRevision = id === durableMetadata?.id ? durableMetadata.revision : current.revision;
      const meta = await dbUpdateCatalog(id, expectedRevision, action, name, fallback?.record.metadata);
      updateMetadata(meta, id);
      if (fallback) adoptCatalog(fallback);
      else if (id === durableMetadata?.id && meta) durableMetadata = meta;
    } catch (error) {
      if (fallback) releasePrepared(fallback.allocated);
      if (error instanceof CatalogConflictError && id === durableMetadata?.id) usePersistenceStore.setState({ saving: 'conflict', error: error.message });
      throw error;
    }
  });
}

export function captureCatalogBackup(): { record: CatalogRecord; draft: boolean; release: () => void } | null {
  const release = acquireExport();
  if (!release || !durableMetadata) { release?.(); return null; }
  return { record: { metadata: { ...durableMetadata }, data: captureState().data }, draft: usePersistenceStore.getState().saving !== 'saved', release };
}
