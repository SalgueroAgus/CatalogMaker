import { DEFAULT_GRID_SHAPE, SHAPE_ITEM_COUNT, type GridShape } from '../types';

export const INDEX_ITEMS_PER_PAGE = 30;

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
): number {
  return Math.floor(productIndex / itemsPerPage) + indexPageCount + 1;
}

export function resolveGridShape(stored: GridShape | undefined, count: number): GridShape {
  return stored && SHAPE_ITEM_COUNT[stored] === count ? stored : DEFAULT_GRID_SHAPE[count];
}
