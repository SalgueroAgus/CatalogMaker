import { create } from 'zustand';
import type { CatalogMetadata } from '../types/catalog';

interface CatalogState {
  catalogs: CatalogMetadata[];
  activeId: string;
  mainId: string;
  epoch: number;
  operationError: string | null;
}

export const useCatalogStore = create<CatalogState>(() => ({ catalogs: [], activeId: '', mainId: '', epoch: 0, operationError: null }));
