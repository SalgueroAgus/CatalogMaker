import { create } from 'zustand';
import type { Product } from '../types';
import { PLACEHOLDER_IMG } from '../utils/image';
import type { ExcelRow } from '../utils/excel';
import { validateProductField, validateProductFields, type EditableProductField } from '../utils/products';
import { canMutate, createImageResource, manageCatalog, mutateCatalog } from './catalogSession';
import type { MutationResult } from './usePersistenceStore';

interface ProductState {
  products: Product[];
  addProducts: (files: File[]) => Promise<MutationResult>;
  addBlankProduct: () => Promise<MutationResult>;
  deleteProduct: (id: string) => Promise<MutationResult>;
  moveProduct: (id: string, direction: 'up' | 'down') => Promise<MutationResult>;
  reorderProduct: (fromId: string, toId: string, above: boolean) => Promise<MutationResult>;
  updateField: (id: string, field: EditableProductField, value: string) => Promise<MutationResult>;
  replaceImage: (id: string, file: File) => Promise<MutationResult>;
  importProducts: (rows: ExcelRow[], imageFiles: File[]) => Promise<MutationResult>;
  resetCatalog: () => Promise<MutationResult>;
  hydrateProducts: (products: Product[]) => void;
}

const ignored = (): Promise<MutationResult> => Promise.resolve({ status: 'ignored' });

function blankProduct(): Product {
  return {
    id: crypto.randomUUID(),
    name: 'NUEVO ARTÍCULO',
    price: '$0.00',
    description: 'Descripción del producto.',
    image: PLACEHOLDER_IMG,
    bgColor: 'rgba(255,255,255,1)',
  };
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  hydrateProducts: (products) => set({ products }),

  addProducts: (files) => {
    const images = files.filter((file) => file.type.startsWith('image/'));
    if (!canMutate() || !images.length) return ignored();
    return mutateCatalog(() => {
      const added = images.map((file) => ({
        ...blankProduct(),
        name: (file.name.replace(/\.[^.]+$/, '') || 'NUEVO PRODUCTO').toUpperCase(),
        image: createImageResource(file),
      }));
      set({ products: [...get().products, ...added] });
    });
  },

  addBlankProduct: () => mutateCatalog(() => set({ products: [...get().products, blankProduct()] })),

  deleteProduct: (id) => {
    if (!get().products.some((p) => p.id === id)) return ignored();
    return mutateCatalog(() => set({ products: get().products.filter((p) => p.id !== id) }));
  },

  moveProduct: (id, direction) => {
    const products = [...get().products];
    const from = products.findIndex((p) => p.id === id);
    const to = direction === 'up' ? from - 1 : direction === 'down' ? from + 1 : -1;
    if (from < 0 || to < 0 || to >= products.length) return ignored();
    [products[from], products[to]] = [products[to], products[from]];
    return mutateCatalog(() => set({ products }));
  },

  reorderProduct: (fromId, toId, above) => {
    const products = [...get().products];
    const from = products.findIndex((p) => p.id === fromId);
    if (fromId === toId || from < 0 || !products.some((p) => p.id === toId)) return ignored();
    const [moved] = products.splice(from, 1);
    const to = products.findIndex((p) => p.id === toId) + (above ? 0 : 1);
    products.splice(to, 0, moved);
    if (products.every((p, index) => p === get().products[index])) return ignored();
    return mutateCatalog(() => set({ products }));
  },

  updateField: (id, field, value) => {
    const error = validateProductField(field, value);
    if (error) return Promise.resolve({ status: 'invalid', error });
    const product = get().products.find((p) => p.id === id);
    if (!product || product[field] === value) return ignored();
    return mutateCatalog(() => set({ products: get().products.map((p) => p.id === id ? { ...p, [field]: value } : p) }));
  },

  replaceImage: (id, file) => {
    if (!canMutate() || !get().products.some((p) => p.id === id) || !file.type.startsWith('image/')) return ignored();
    return mutateCatalog(() => {
      const image = createImageResource(file);
      set({ products: get().products.map((p) => p.id === id ? { ...p, image } : p) });
    });
  },

  importProducts: (rows, imageFiles) => {
    if (!canMutate() || !rows.length) return ignored();
    for (const [index, row] of rows.entries()) {
      const error = validateProductFields(row);
      if (error) return Promise.resolve({ status: 'invalid', error: `Fila ${index + 2}: ${error}` });
    }
    const fileMap = new Map(imageFiles.filter((f) => f.type.startsWith('image/')).map((f) => [f.name.replace(/\.[^.]+$/, '').trim().toLowerCase(), f]));
    return mutateCatalog(() => {
      const added = rows.map((row) => {
        const file = fileMap.get(row.name.trim().toLowerCase());
        return { ...blankProduct(), ...row, image: file ? createImageResource(file) : PLACEHOLDER_IMG };
      });
      set({ products: [...get().products, ...added] });
    });
  },

  resetCatalog: () => manageCatalog('products'),
}));
