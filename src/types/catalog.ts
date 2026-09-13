import type { Colors, Fonts, FontSizes, GridShape, Product } from './index';

export type ProductMeta = Omit<Product, 'image'>;

export type PersistedSettings = {
  storeName: string;
  footerContact: string;
  footerTag?: string;
  footerTagUrl?: string;
  indexBackgroundMode?: 'global' | 'image' | 'color';
  indexBgColor?: string;
  indexBgImageOpacity?: number;
  colors: Colors;
  fonts: Fonts;
  fontSizes: FontSizes;
  bgImageOpacity: number;
  itemsPerPage: number;
  pageLayouts: Record<number, GridShape>;
  pageItemCounts?: Record<number, number>;
};

export interface StoredCatalog {
  products: ProductMeta[];
  settings: PersistedSettings | null;
  images: Map<string, Blob>;
  background: Blob | null;
  indexBackground?: Blob | null;
}

export interface CatalogMetadata {
  id: string;
  name: string;
  createdAt: string;
  lastSavedAt: string;
  revision: number;
  productCount: number;
  deletedAt: string | null;
}

export interface CatalogRegistry {
  version: 1;
  mainId: string;
  lastActiveId: string;
  migration: 'pending' | 'ready';
}

export interface CatalogLibrary {
  registry: CatalogRegistry;
  catalogs: CatalogMetadata[];
}

export interface CatalogRecord {
  metadata: CatalogMetadata;
  data: StoredCatalog;
}
