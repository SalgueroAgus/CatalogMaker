export const INDEX_ITEMS_PER_PAGE = 30;

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export function getIndexPageCount(productCount: number): number {
  return Math.max(1, Math.ceil(productCount / INDEX_ITEMS_PER_PAGE));
}

export function getProductPage(
  productIndex: number,
  itemsPerPage: number,
  indexPageCount = 1,
): number {
  return Math.floor(productIndex / itemsPerPage) + indexPageCount + 1;
}
