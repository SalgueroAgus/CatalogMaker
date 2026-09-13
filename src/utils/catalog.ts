import type { PersistedSettings, ProductMeta } from '../types/catalog';
import { isPageItemCount } from './chunks';
import { isImagePosition } from './image';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readProducts(value: unknown): ProductMeta[] {
  if (value === undefined) return [];
  const ids = new Set<string>();
  if (!Array.isArray(value) || !value.every((product: unknown) => {
    if (!isRecord(product) || !['id', 'name', 'price', 'description', 'bgColor'].every((key) => typeof product[key] === 'string')) return false;
    if (product.imagePositionY !== undefined && !isImagePosition(product.imagePositionY)) return false;
    const id = product.id as string;
    if (!id || ids.has(id)) return false;
    ids.add(id);
    return true;
  })) throw new Error('Los productos guardados no se pueden interpretar. No se modificaron los datos.');
  return (value as ProductMeta[]).map(({ id, name, price, description, bgColor, imagePositionY }) => ({ id, name, price, description, bgColor, ...(imagePositionY === undefined ? {} : { imagePositionY }) }));
}

export function readSettings(value: unknown): PersistedSettings | null {
  if (value === undefined) return null;
  if (!isRecord(value) || typeof value.storeName !== 'string' || typeof value.footerContact !== 'string'
    || (value.footerTagUrl !== undefined && typeof value.footerTagUrl !== 'string')
    || (value.indexBackgroundMode !== undefined && (typeof value.indexBackgroundMode !== 'string' || !['global', 'image', 'color'].includes(value.indexBackgroundMode)))
    || (value.indexBgColor !== undefined && typeof value.indexBgColor !== 'string')
    || (value.indexBgImageOpacity !== undefined && (typeof value.indexBgImageOpacity !== 'number' || !Number.isFinite(value.indexBgImageOpacity) || value.indexBgImageOpacity < 0 || value.indexBgImageOpacity > 1))
    || (value.footerTag !== undefined && typeof value.footerTag !== 'string')
    || !isRecord(value.colors) || !isRecord(value.fonts) || !isRecord(value.fontSizes) || !isRecord(value.pageLayouts)
    || !isPageItemCount(value.itemsPerPage)
    || (value.pageItemCounts !== undefined && (!isRecord(value.pageItemCounts)
      || !Object.entries(value.pageItemCounts).every(([key, count]) => /^(0|[1-9]\d*)$/.test(key) && Number.isSafeInteger(Number(key)) && isPageItemCount(count))))
    || typeof value.bgImageOpacity !== 'number' || !Number.isFinite(value.bgImageOpacity)
    || value.bgImageOpacity < 0 || value.bgImageOpacity > 1
    || !Object.values(value.colors).every((v) => typeof v === 'string')
    || !Object.values(value.fonts).every((v) => typeof v === 'string')
    || !Object.values(value.fontSizes).every((v) => typeof v === 'number' && Number.isFinite(v))) {
    throw new Error('Los ajustes guardados no se pueden interpretar. No se modificaron los datos.');
  }
  const source = value as PersistedSettings;
  return {
    storeName: source.storeName, footerContact: source.footerContact, footerTag: source.footerTag, footerTagUrl: source.footerTagUrl,
    indexBackgroundMode: source.indexBackgroundMode, indexBgColor: source.indexBgColor, indexBgImageOpacity: source.indexBgImageOpacity,
    colors: source.colors, fonts: source.fonts, fontSizes: source.fontSizes, bgImageOpacity: source.bgImageOpacity,
    itemsPerPage: source.itemsPerPage, pageLayouts: source.pageLayouts, pageItemCounts: source.pageItemCounts,
  };
}

export function catalogFilename(name: string): string {
  return name.trim().toLowerCase().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, '-').replace(/^[.]+|[.]+$/g, '') || 'catalogo';
}

export function availableCatalogName(base: string, names: string[]): string {
  const existing = new Set(names.map((name) => name.trim().toLocaleLowerCase()));
  let name = base.trim() || 'Nuevo catálogo';
  let suffix = 2;
  while (existing.has(name.toLocaleLowerCase())) name = `${base} (${suffix++})`;
  return name;
}
