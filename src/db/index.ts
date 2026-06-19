import { get, set, del } from 'idb-keyval';
import type { Colors, Fonts, FontSizes, GridShape } from '../types';
import { PLACEHOLDER_IMG } from '../utils/image';

export type ProductMeta = {
  id: string;
  name: string;
  price: string;
  description: string;
  bgColor: string;
};

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

// ── Products ─────────────────────────────────────────────

export function dbSaveProducts(meta: ProductMeta[]): void {
  set('cm:products', meta);
}

export function dbSaveImage(id: string, blob: Blob): void {
  set(`cm:img:${id}`, blob);
}

export function dbDeleteImage(id: string): void {
  del(`cm:img:${id}`);
}

export async function dbLoadProducts(): Promise<Array<ProductMeta & { image: string }>> {
  const meta: ProductMeta[] | undefined = await get('cm:products');
  if (!meta?.length) return [];
  return Promise.all(
    meta.map(async (p) => {
      const blob: Blob | undefined = await get(`cm:img:${p.id}`);
      return { ...p, image: blob ? URL.createObjectURL(blob) : PLACEHOLDER_IMG };
    })
  );
}

export function dbClearProducts(): void {
  get<ProductMeta[]>('cm:products').then((meta) => {
    if (meta) meta.forEach((p) => del(`cm:img:${p.id}`));
  });
  del('cm:products');
}

// ── Background image ─────────────────────────────────────

export function dbSaveBgImage(blob: Blob | null): void {
  if (blob) set('cm:bg', blob);
  else del('cm:bg');
}

export async function dbLoadBgImage(): Promise<string | null> {
  const blob: Blob | undefined = await get('cm:bg');
  return blob ? URL.createObjectURL(blob) : null;
}

// ── Settings ─────────────────────────────────────────────

export function dbSaveSettings(settings: PersistedSettings): void {
  set('cm:settings', settings);
}

export async function dbLoadSettings(): Promise<PersistedSettings | null> {
  return (await get<PersistedSettings>('cm:settings')) ?? null;
}

export function dbClearSettings(): void {
  del('cm:settings');
}

// ── Nuclear reset ─────────────────────────────────────────

export function dbClearAll(): void {
  dbClearProducts();
  dbSaveBgImage(null);
  dbClearSettings();
}
