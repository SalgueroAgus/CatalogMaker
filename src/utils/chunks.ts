import { DEFAULT_GRID_SHAPE, SHAPE_ITEM_COUNT, type GridShape } from '../types';

export const INDEX_ITEMS_PER_PAGE = 30;

export interface ProductPageChunk<T> {
  products: T[];
  startIndex: number;
  capacity: number;
}

export function isPageItemCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

function pageCapacity(pageIndex: number, defaultCount: number, overrides: Record<number, number>): number {
  const count = overrides[pageIndex];
  return isPageItemCount(count) ? count : defaultCount;
}

export function paginateProducts<T>(products: T[], defaultCount: number, overrides: Record<number, number> = {}): ProductPageChunk<T>[] {
  if (!isPageItemCount(defaultCount)) return [];
  const pages: ProductPageChunk<T>[] = [];
  let startIndex = 0;
  while (startIndex < products.length) {
    const capacity = pageCapacity(pages.length, defaultCount, overrides);
    pages.push({ products: products.slice(startIndex, startIndex + capacity), startIndex, capacity });
    startIndex += capacity;
  }
  return pages;
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export function getIndexPageCount(productCount: number): number {
  return Math.max(0, Math.ceil(productCount / INDEX_ITEMS_PER_PAGE));
}

export function getProductPage(
  productIndex: number,
  itemsPerPage: number,
  indexPageCount: number,
  overrides: Record<number, number> = {},
): number {
  if (!Number.isInteger(productIndex) || productIndex < 0 || !isPageItemCount(itemsPerPage)) return 0;
  let pageIndex = 0;
  let startIndex = 0;
  while (productIndex >= startIndex + pageCapacity(pageIndex, itemsPerPage, overrides)) {
    startIndex += pageCapacity(pageIndex, itemsPerPage, overrides);
    pageIndex++;
  }
  return pageIndex + indexPageCount + 1;
}

export function resolveGridShape(stored: GridShape | undefined, count: number): GridShape {
  return stored && SHAPE_ITEM_COUNT[stored] === count ? stored : DEFAULT_GRID_SHAPE[count];
}
