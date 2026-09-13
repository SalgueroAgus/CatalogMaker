import type { UITheme } from '../types';
import type { CatalogLibrary, CatalogMetadata, CatalogRecord, CatalogRegistry, StoredCatalog } from '../types/catalog';
import { isRecord, readProducts, readSettings } from '../utils/catalog';
export type { ProductMeta, PersistedSettings, StoredCatalog } from '../types/catalog';

export function dbLoadUITheme(): UITheme {
  try {
    return localStorage.getItem('cm:ui-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function dbSaveUITheme(theme: UITheme): boolean {
  try {
    localStorage.setItem('cm:ui-theme', theme);
    return true;
  } catch {
    return false;
  }
}

const REGISTRY_KEY = 'cm:catalogs';
const META_PREFIX = 'cm:catalog-meta:';
const catalogPrefix = (id: string) => `cm:catalog:${id}:`;

export class CatalogConflictError extends Error {
  constructor() { super('Este catálogo cambió en otra pestaña. Cargá la versión guardada o conservá tus cambios como copia.'); }
}

type Failure = (error: unknown) => void;

function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, result: (value: T) => void, fail: Failure) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('keyval-store');
    let abandoned = false;
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains('keyval')) open.result.createObjectStore('keyval');
    };
    open.onerror = () => reject(open.error);
    open.onblocked = () => { abandoned = true; reject(new Error('Cerrá otras pestañas del catálogo y reintentá.')); };
    open.onsuccess = () => {
      const db = open.result;
      if (abandoned) { db.close(); return; }
      let tx: IDBTransaction;
      try { tx = db.transaction('keyval', mode); } catch (error) { db.close(); reject(error); return; }
      let value: T;
      let failure: unknown;
      const fail: Failure = (error) => {
        failure = error;
        try { tx.abort(); } catch { db.close(); reject(error); }
      };
      tx.oncomplete = () => { db.close(); resolve(value); };
      tx.onerror = (event) => { failure ??= (event.target as IDBRequest).error; };
      tx.onabort = () => { db.close(); reject(failure ?? tx.error ?? new Error('La operación de guardado se interrumpió.')); };
      try { run(tx.objectStore('keyval'), (next) => { value = next; }, fail); } catch (error) { fail(error); }
    };
  });
}

function read<T>(request: IDBRequest<T>, next: (value: T) => void, fail: Failure) {
  request.onsuccess = () => { try { next(request.result); } catch (error) { fail(error); } };
}

function scan(store: IDBObjectStore, prefix: string, done: (values: Map<string, unknown>) => void, fail: Failure) {
  const values = new Map<string, unknown>();
  const cursor = store.openCursor(IDBKeyRange.bound(prefix, `${prefix}\uffff`));
  read(cursor, (entry) => {
    if (!entry) { done(values); return; }
    values.set(String(entry.key).slice(prefix.length), entry.value);
    entry.continue();
  }, fail);
}

function registry(value: unknown): CatalogRegistry {
  if (!isRecord(value) || value.version !== 1 || typeof value.mainId !== 'string' || !value.mainId
    || typeof value.lastActiveId !== 'string' || !value.lastActiveId || (value.migration !== 'pending' && value.migration !== 'ready')) {
    throw new Error('La lista de catálogos no se puede interpretar. No se modificaron los datos.');
  }
  return value as unknown as CatalogRegistry;
}

function metadata(value: unknown): CatalogMetadata {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id || typeof value.name !== 'string' || !value.name.trim()
    || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))
    || typeof value.lastSavedAt !== 'string' || !Number.isFinite(Date.parse(value.lastSavedAt))
    || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1
    || !Number.isSafeInteger(value.productCount) || Number(value.productCount) < 0
    || (value.deletedAt !== null && (typeof value.deletedAt !== 'string' || !Number.isFinite(Date.parse(value.deletedAt))))) {
    throw new Error('Los datos del catálogo no se pueden interpretar.');
  }
  return value as unknown as CatalogMetadata;
}

function decodeCatalog(records: Map<string, unknown>): StoredCatalog {
  const images = new Map<string, Blob>();
  for (const [key, value] of records) {
    if (key.startsWith('img:')) {
      if (!(value instanceof Blob)) throw new Error('Una foto guardada no se puede leer. No se modificaron los datos.');
      images.set(key.slice(4), value);
    }
  }
  const background = records.get('bg');
  const indexBackground = records.get('index-bg');
  if ((background !== undefined && !(background instanceof Blob)) || (indexBackground !== undefined && !(indexBackground instanceof Blob))) {
    throw new Error('Un fondo guardado no se puede leer. No se modificaron los datos.');
  }
  return { products: readProducts(records.get('products')), settings: readSettings(records.get('settings')), images, background: background ?? null, indexBackground: indexBackground ?? null };
}

function readLibrary(store: IDBObjectStore, done: (value: CatalogLibrary | null) => void, fail: Failure) {
  read(store.get(REGISTRY_KEY), (value: unknown) => {
    if (value === undefined) { done(null); return; }
    const root = registry(value);
    scan(store, META_PREFIX, (records) => {
      const catalogs = [...records].map(([id, value]) => {
        const item = metadata(value);
        if (item.id !== id) throw new Error('La identificación del catálogo no coincide.');
        return item;
      });
      if (!catalogs.some((item) => item.id === root.mainId && !item.deletedAt)) throw new Error('No se puede encontrar Principal. No se modificaron los datos.');
      done({ registry: root, catalogs });
    }, fail);
  }, fail);
}

export function dbReadLibrary(): Promise<CatalogLibrary> {
  return transaction('readonly', (store, done, fail) => readLibrary(store, (library) => {
    if (!library) throw new Error('La lista de catálogos todavía no está preparada.');
    done(library);
  }, fail));
}

function writeData(store: IDBObjectStore, id: string, next: StoredCatalog, previous?: StoredCatalog) {
  const prefix = catalogPrefix(id);
  store.put(next.products, `${prefix}products`);
  if (next.settings) store.put(next.settings, `${prefix}settings`);
  else store.delete(`${prefix}settings`);
  for (const [imageId, blob] of next.images) {
    if (previous?.images.get(imageId) !== blob) store.put(blob, `${prefix}img:${imageId}`);
  }
  for (const imageId of previous?.images.keys() ?? []) {
    if (!next.images.has(imageId)) store.delete(`${prefix}img:${imageId}`);
  }
  for (const [key, blob, old] of [['bg', next.background, previous?.background], ['index-bg', next.indexBackground, previous?.indexBackground]] as const) {
    if (blob !== old) {
      if (blob) store.put(blob, `${prefix}${key}`);
      else store.delete(`${prefix}${key}`);
    }
  }
}

export async function dbInitializeCatalogs(): Promise<CatalogLibrary> {
  let library = await transaction<CatalogLibrary | null>('readonly', (store, done, fail) => readLibrary(store, done, fail));
  if (!library) {
    const legacy = await transaction<StoredCatalog>('readonly', (store, done, fail) => scan(store, 'cm:', (records) => done(decodeCatalog(records)), fail));
    await transaction<void>('readwrite', (store, done, fail) => {
      read(store.get(REGISTRY_KEY), (existing: unknown) => {
        if (existing !== undefined) { registry(existing); done(undefined); return; }
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        writeData(store, id, legacy);
        store.put({ id, name: 'Principal', createdAt: now, lastSavedAt: now, revision: 1, productCount: legacy.products.length, deletedAt: null } satisfies CatalogMetadata, `${META_PREFIX}${id}`);
        store.put({ version: 1, mainId: id, lastActiveId: id, migration: 'pending' } satisfies CatalogRegistry, REGISTRY_KEY);
        done(undefined);
      }, fail);
    });
    library = await dbReadLibrary();
  }
  if (library.registry.migration === 'pending') {
    await dbLoadCatalogRecord(library.registry.mainId);
    await transaction<void>('readwrite', (store, done, fail) => read(store.get(REGISTRY_KEY), (value: unknown) => {
      const root = registry(value);
      store.put({ ...root, migration: 'ready' }, REGISTRY_KEY);
      done(undefined);
    }, fail));
    library = await dbReadLibrary();
  }
  return library;
}

export function dbLoadCatalogRecord(id: string, includeDeleted = false): Promise<CatalogRecord> {
  return transaction('readonly', (store, done, fail) => read(store.get(`${META_PREFIX}${id}`), (value: unknown) => {
    if (value === undefined) throw new CatalogConflictError();
    const meta = metadata(value);
    if (meta.deletedAt && !includeDeleted) throw new CatalogConflictError();
    scan(store, catalogPrefix(id), (records) => {
      if (!records.has('products')) throw new Error('Faltan los productos del catálogo. No se modificaron los datos.');
      const data = decodeCatalog(records);
      if (data.products.length !== meta.productCount) throw new Error('El catálogo guardado está incompleto.');
      done({ metadata: meta, data });
    }, fail);
  }, fail));
}

export async function dbLoadCatalog(id?: string): Promise<StoredCatalog> {
  const target = id ?? (await dbReadLibrary()).registry.lastActiveId;
  return (await dbLoadCatalogRecord(target)).data;
}

function checkRevision(value: unknown, revision: number, allowDeleted = false): CatalogMetadata {
  if (value === undefined) throw new CatalogConflictError();
  const current = metadata(value);
  if (current.revision !== revision || (!allowDeleted && current.deletedAt)) throw new CatalogConflictError();
  return current;
}

export function dbSaveCatalog(id: string, next: StoredCatalog, durable: StoredCatalog, expectedRevision: number): Promise<CatalogMetadata> {
  return transaction('readwrite', (store, done, fail) => read(store.get(`${META_PREFIX}${id}`), (value: unknown) => {
    const current = checkRevision(value, expectedRevision);
    const meta = { ...current, revision: current.revision + 1, lastSavedAt: new Date().toISOString(), productCount: next.products.length };
    writeData(store, id, next, durable);
    store.put(meta, `${META_PREFIX}${id}`);
    done(meta);
  }, fail));
}

function validateName(name: string, catalogs: CatalogMetadata[], exceptId?: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Escribí un nombre para el catálogo.');
  if (catalogs.some((item) => !item.deletedAt && item.id !== exceptId && item.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) throw new Error('Ya existe un catálogo con ese nombre. Elegí otro.');
  return trimmed;
}

export function dbCreateCatalog(id: string, name: string, data: StoredCatalog): Promise<CatalogMetadata> {
  return transaction('readwrite', (store, done, fail) => readLibrary(store, (library) => {
    if (!library || library.registry.migration !== 'ready') throw new Error('La lista de catálogos todavía no está preparada.');
    if (library.catalogs.some((item) => item.id === id)) throw new Error('El catálogo ya existe.');
    const now = new Date().toISOString();
    const meta: CatalogMetadata = { id, name: validateName(name, library.catalogs), createdAt: now, lastSavedAt: now, revision: 1, productCount: data.products.length, deletedAt: null };
    writeData(store, id, data);
    store.put(meta, `${META_PREFIX}${id}`);
    store.put({ ...library.registry, lastActiveId: id }, REGISTRY_KEY);
    done(meta);
  }, fail));
}

export function dbSelectCatalog(id: string, expectedRevision: number): Promise<void> {
  return transaction('readwrite', (store, done, fail) => read(store.get(`${META_PREFIX}${id}`), (value: unknown) => {
    checkRevision(value, expectedRevision);
    read(store.get(REGISTRY_KEY), (value: unknown) => {
      store.put({ ...registry(value), lastActiveId: id }, REGISTRY_KEY);
      done(undefined);
    }, fail);
  }, fail));
}

export function dbUpdateCatalog(id: string, expectedRevision: number, action: 'rename' | 'delete' | 'restore' | 'purge', name?: string, fallback?: CatalogMetadata): Promise<CatalogMetadata | null> {
  return transaction('readwrite', (store, done, fail) => readLibrary(store, (library) => {
    if (!library) throw new Error('No se puede leer la lista de catálogos.');
    const current = checkRevision(library.catalogs.find((item) => item.id === id), expectedRevision, action === 'restore' || action === 'purge');
    if (id === library.registry.mainId && action !== 'rename') throw new Error('Principal no se puede eliminar ni reemplazar.');
    if ((action === 'restore' || action === 'purge') && !current.deletedAt) throw new CatalogConflictError();
    if (fallback) checkRevision(library.catalogs.find((item) => item.id === fallback.id), fallback.revision);
    const meta = { ...current, revision: current.revision + 1 };
    if (action === 'rename' || action === 'restore') meta.name = validateName(name ?? current.name, library.catalogs, id);
    if (action === 'rename') meta.lastSavedAt = new Date().toISOString();
    if (action === 'delete') meta.deletedAt = new Date().toISOString();
    if (action === 'restore') meta.deletedAt = null;
    if (action === 'purge') {
      const prefix = catalogPrefix(id);
      const cursor = store.openKeyCursor(IDBKeyRange.bound(prefix, `${prefix}\uffff`));
      read(cursor, (entry) => {
        if (entry) { store.delete(entry.key); entry.continue(); return; }
        store.delete(`${META_PREFIX}${id}`);
        done(null);
      }, fail);
    } else {
      store.put(meta, `${META_PREFIX}${id}`);
      done(meta);
    }
    if (action === 'delete' && (fallback || library.registry.lastActiveId === id)) store.put({ ...library.registry, lastActiveId: library.registry.mainId }, REGISTRY_KEY);
  }, fail));
}
