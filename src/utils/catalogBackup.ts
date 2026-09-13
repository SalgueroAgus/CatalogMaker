import type { CatalogRecord, StoredCatalog } from '../types/catalog';
import { isRecord, readProducts, readSettings } from './catalog';
import { SHAPE_ITEM_COUNT } from '../types';

interface EncodedImage {
  type: string;
  base64: string;
}

export interface ParsedCatalogBackup {
  name: string;
  data: StoredCatalog;
}

async function encodeImage(blob: Blob | null | undefined): Promise<EncodedImage | null> {
  if (!blob) return null;
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer una imagen para el respaldo.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(blob);
  });
  return { type: blob.type, base64 };
}

export async function buildCatalogBackup(record: CatalogRecord): Promise<Blob> {
  const images: { id: string; image: EncodedImage | null }[] = [];
  for (const product of record.data.products) {
    const blob = record.data.images.get(product.id);
    if (blob) images.push({ id: product.id, image: await encodeImage(blob) });
  }
  const backup = {
    format: 'CatalogMaker', version: 1, exportedAt: new Date().toISOString(),
    catalog: { ...record.metadata, productCount: record.data.products.length, deletedAt: null },
    products: record.data.products, settings: record.data.settings, images,
    background: await encodeImage(record.data.background), indexBackground: await encodeImage(record.data.indexBackground),
  };
  return new Blob([JSON.stringify(backup)], { type: 'application/json' });
}

async function decodeImage(value: unknown): Promise<Blob | null> {
  if (value === null) return null;
  if (!isRecord(value) || typeof value.type !== 'string' || (value.type !== '' && !value.type.startsWith('image/')) || typeof value.base64 !== 'string'
    || !value.base64.length || value.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value.base64)) throw new Error('El respaldo contiene una imagen inválida.');
  const bytes = Uint8Array.from(atob(value.base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: value.type });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Imagen vacía.');
  } catch { throw new Error('No se puede abrir una imagen del respaldo. No se restauró el catálogo.'); }
  finally { URL.revokeObjectURL(url); }
  return blob;
}

export async function parseCatalogBackup(file: Blob): Promise<ParsedCatalogBackup> {
  let value: unknown;
  try { value = JSON.parse(await file.text()); } catch { throw new Error('El archivo no es un respaldo de CatalogMaker válido.'); }
  if (!isRecord(value) || value.format !== 'CatalogMaker') throw new Error('Elegí un respaldo de CatalogMaker, no un PDF ni un Excel.');
  if (value.version !== 1) throw new Error('Esta versión del respaldo no es compatible con la aplicación.');
  const meta = value.catalog;
  if (!isRecord(meta) || typeof meta.name !== 'string' || !meta.name.trim() || typeof meta.id !== 'string' || !meta.id
    || !Number.isSafeInteger(meta.revision) || Number(meta.revision) < 1
    || typeof meta.createdAt !== 'string' || !Number.isFinite(Date.parse(meta.createdAt))
    || typeof meta.lastSavedAt !== 'string' || !Number.isFinite(Date.parse(meta.lastSavedAt))
    || typeof value.exportedAt !== 'string' || !Number.isFinite(Date.parse(value.exportedAt))
    || meta.deletedAt !== null || !Array.isArray(value.products) || !Array.isArray(value.images)) throw new Error('El respaldo tiene datos incompletos.');
  const products = readProducts(value.products);
  if (products.length !== meta.productCount) throw new Error('La cantidad de productos del respaldo no coincide.');
  const settings = readSettings(value.settings === null ? undefined : value.settings);
  if (settings && !Object.entries(settings.pageLayouts).every(([page, shape]) => /^(0|[1-9]\d*)$/.test(page) && Number.isSafeInteger(Number(page)) && Object.prototype.hasOwnProperty.call(SHAPE_ITEM_COUNT, shape))) throw new Error('El respaldo tiene distribuciones de página inválidas.');
  const ids = new Set(products.map((product) => product.id));
  const images = new Map<string, Blob>();
  for (const entry of value.images) {
    if (!isRecord(entry) || typeof entry.id !== 'string' || !ids.has(entry.id) || images.has(entry.id)) throw new Error('Las referencias a fotos del respaldo son inválidas.');
    const blob = await decodeImage(entry.image);
    if (!blob) throw new Error('Falta una foto del respaldo.');
    images.set(entry.id, blob);
  }
  const background = await decodeImage(value.background);
  const indexBackground = await decodeImage(value.indexBackground);
  return { name: meta.name.trim(), data: { products, settings, images, background, indexBackground } };
}

export function downloadCatalogFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
