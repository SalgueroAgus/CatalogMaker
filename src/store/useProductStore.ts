import { create } from 'zustand';
import type { Product } from '../types';
import { PLACEHOLDER_IMG } from '../utils/image';

interface ProductState {
  products: Product[];
  addProducts: (files: File[]) => void;
  addBlankProduct: () => void;
  deleteProduct: (id: string) => void;
  moveProduct: (id: string, direction: 'up' | 'down') => void;
  reorderProduct: (fromId: string, toId: string, above: boolean) => void;
  updateField: (id: string, field: keyof Omit<Product, 'id'>, value: string) => void;
  replaceImage: (id: string, file: File) => void;
  resetCatalog: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],

  addProducts: (files) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    const newProducts: Product[] = images.map((file, i) => ({
      id: String(Date.now() + i),
      name: (file.name.substring(0, file.name.lastIndexOf('.')) || 'NUEVO PRODUCTO').toUpperCase(),
      price: '$0.00',
      description: 'Descripción del producto.',
      image: URL.createObjectURL(file),
      bgColor: '#ffffff',
    }));
    set((s) => ({ products: [...s.products, ...newProducts] }));
  },

  addBlankProduct: () =>
    set((s) => ({
      products: [
        ...s.products,
        {
          id: String(Date.now()),
          name: 'NUEVO ARTÍCULO',
          price: '$0.00',
          description: 'Descripción del producto.',
          image: PLACEHOLDER_IMG,
          bgColor: '#ffffff',
        },
      ],
    })),

  deleteProduct: (id) =>
    set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

  moveProduct: (id, direction) =>
    set((s) => {
      const arr = [...s.products];
      const idx = arr.findIndex((p) => p.id === id);
      if (direction === 'up' && idx > 0)
        [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
      else if (direction === 'down' && idx < arr.length - 1)
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return { products: arr };
    }),

  reorderProduct: (fromId, toId, above) =>
    set((s) => {
      const arr = [...s.products];
      const fromIdx = arr.findIndex((p) => p.id === fromId);
      const [moved] = arr.splice(fromIdx, 1);
      let toIdx = arr.findIndex((p) => p.id === toId);
      if (!above) toIdx++;
      arr.splice(toIdx, 0, moved);
      return { products: arr };
    }),

  updateField: (id, field, value) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    })),

  replaceImage: (id, file) => {
    const url = URL.createObjectURL(file);
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, image: url } : p)),
    }));
  },

  resetCatalog: () => set({ products: [] }),
}));
