import type { Colors, Fonts, FontSizes, GridShape, Product } from '../types';

export type ProductMeta = Omit<Product, 'image'>;

export type PersistedSettings = {
  storeName: string;
  footerContact: string;
  colors: Colors;
  fonts: Fonts;
  fontSizes: FontSizes;
  bgImageOpacity: number;
  itemsPerPage: number;
  pageLayouts: Record<number, GridShape>;
};

export interface StoredCatalog {
  products: ProductMeta[];
  settings: PersistedSettings | null;
  images: Map<string, Blob>;
  background: Blob | null;
}

function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('keyval-store');
    let abandoned = false;
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains('keyval')) open.result.createObjectStore('keyval');
    };
    open.onerror = () => reject(open.error);
    open.onblocked = () => {
      abandoned = true;
      reject(new Error('Cerrá otras pestañas del catálogo y reintentá.'));
    };
    open.onsuccess = () => {
      const db = open.result;
      if (abandoned) {
        db.close();
        return;
      }
      let tx: IDBTransaction;
      try {
        tx = db.transaction('keyval', mode);
      } catch (error) {
        db.close();
        reject(error);
        return;
      }
      let value: T;
      let failure: unknown;
      tx.oncomplete = () => {
        db.close();
        resolve(value);
      };
      tx.onerror = (event) => {
        failure ??= (event.target as IDBRequest).error;
      };
      tx.onabort = () => {
        db.close();
        reject(failure ?? tx.error ?? new Error('La operación de guardado se interrumpió.'));
      };
      try {
        run(tx.objectStore('keyval'), (next) => { value = next; });
      } catch (error) {
        failure = error;
        try {
          tx.abort();
        } catch {
          db.close();
          reject(error);
        }
      }
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readProducts(value: unknown): ProductMeta[] {
  if (value === undefined) return [];
  const ids = new Set<string>();
  if (!Array.isArray(value) || !value.every((product: unknown) => {
    if (!isRecord(product) || !['id', 'name', 'price', 'description', 'bgColor'].every((key) => typeof product[key] === 'string')) return false;
    const id = product.id as string;
    if (!id || ids.has(id)) return false;
    ids.add(id);
    return true;
  })) throw new Error('Los productos guardados no se pueden interpretar. No se modificaron los datos.');
  return value as ProductMeta[];
}

function readSettings(value: unknown): PersistedSettings | null {
  if (value === undefined) return null;
  if (!isRecord(value) || typeof value.storeName !== 'string' || typeof value.footerContact !== 'string'
    || !isRecord(value.colors) || !isRecord(value.fonts) || !isRecord(value.fontSizes) || !isRecord(value.pageLayouts)
    || !Number.isInteger(value.itemsPerPage) || Number(value.itemsPerPage) < 1 || Number(value.itemsPerPage) > 5
    || typeof value.bgImageOpacity !== 'number' || !Number.isFinite(value.bgImageOpacity)
    || value.bgImageOpacity < 0 || value.bgImageOpacity > 1
    || !Object.values(value.colors).every((v) => typeof v === 'string')
    || !Object.values(value.fonts).every((v) => typeof v === 'string')
    || !Object.values(value.fontSizes).every((v) => typeof v === 'number' && Number.isFinite(v))) {
    throw new Error('Los ajustes guardados no se pueden interpretar. No se modificaron los datos.');
  }
  return value as PersistedSettings;
}

export async function dbLoadCatalog(): Promise<StoredCatalog> {
  const records = await transaction<Map<string, unknown>>('readonly', (store, result) => {
    const values = new Map<string, unknown>();
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (!entry) {
        result(values);
        return;
      }
      if (typeof entry.key === 'string') values.set(entry.key, entry.value);
      entry.continue();
    };
  });
  const images = new Map<string, Blob>();
  for (const [key, value] of records) {
    if (key.startsWith('cm:img:')) {
      if (!(value instanceof Blob)) throw new Error('Una foto guardada no se puede leer. No se modificaron los datos.');
      images.set(key.slice(7), value);
    }
  }
  const background = records.get('cm:bg');
  if (background !== undefined && !(background instanceof Blob)) throw new Error('El fondo guardado no se puede leer. No se modificaron los datos.');
  return {
    products: readProducts(records.get('cm:products')),
    settings: readSettings(records.get('cm:settings')),
    images,
    background: background ?? null,
  };
}

export function dbSaveCatalog(next: StoredCatalog, durable: StoredCatalog): Promise<void> {
  return transaction<void>('readwrite', (store, result) => {
    store.put(next.products, 'cm:products');
    store.put(next.settings, 'cm:settings');
    for (const [id, blob] of next.images) {
      if (durable.images.get(id) !== blob) store.put(blob, `cm:img:${id}`);
    }
    for (const id of durable.images.keys()) {
      if (!next.images.has(id)) store.delete(`cm:img:${id}`);
    }
    if (next.background !== durable.background) {
      if (next.background) store.put(next.background, 'cm:bg');
      else store.delete('cm:bg');
    }
    result(undefined);
  });
}
