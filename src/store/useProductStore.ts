import { create } from 'zustand';
import type { Product } from '../types';
import { PLACEHOLDER_IMG } from '../utils/image';
import type { ExcelRow } from '../utils/excel';
import {
  dbSaveProducts,
  dbSaveImage,
  dbDeleteImage,
  dbClearProducts,
  type ProductMeta,
} from '../db';

const toMeta = (p: Product): ProductMeta => ({
  id: p.id,
  name: p.name,
  price: p.price,
  description: p.description,
  bgColor: p.bgColor,
});

interface ProductState {
  products: Product[];
  addProducts: (files: File[]) => void;
  addBlankProduct: () => void;
  deleteProduct: (id: string) => void;
  moveProduct: (id: string, direction: 'up' | 'down') => void;
  reorderProduct: (fromId: string, toId: string, above: boolean) => void;
  updateField: (id: string, field: keyof Omit<Product, 'id'>, value: string) => void;
  replaceImage: (id: string, file: File) => void;
  importProducts: (rows: ExcelRow[], imageFiles: File[]) => void;
  resetCatalog: () => void;
  hydrateProducts: (products: Product[]) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],

  hydrateProducts: (products) => set({ products }),

  addProducts: (files) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    const newProducts: Product[] = images.map((file, i) => ({
      id: String(Date.now() + i),
      name: (file.name.substring(0, file.name.lastIndexOf('.')) || 'NUEVO PRODUCTO').toUpperCase(),
      price: '$0.00',
      description: 'Descripción del producto.',
      image: URL.createObjectURL(file),
      bgColor: 'rgba(255,255,255,1)',
    }));
    newProducts.forEach((p, i) => dbSaveImage(p.id, images[i]));
    set((s) => {
      const updated = [...s.products, ...newProducts];
      dbSaveProducts(updated.map(toMeta));
      return { products: updated };
    });
  },

  addBlankProduct: () =>
    set((s) => {
      const blank: Product = {
        id: String(Date.now()),
        name: 'NUEVO ARTÍCULO',
        price: '$0.00',
        description: 'Descripción del producto.',
        image: PLACEHOLDER_IMG,
        bgColor: 'rgba(255,255,255,1)',
      };
      const updated = [...s.products, blank];
      dbSaveProducts(updated.map(toMeta));
      return { products: updated };
    }),

  deleteProduct: (id) =>
    set((s) => {
      const updated = s.products.filter((p) => p.id !== id);
      dbDeleteImage(id);
      dbSaveProducts(updated.map(toMeta));
      return { products: updated };
    }),

  moveProduct: (id, direction) =>
    set((s) => {
      const arr = [...s.products];
      const idx = arr.findIndex((p) => p.id === id);
      if (direction === 'up' && idx > 0)
        [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
      else if (direction === 'down' && idx < arr.length - 1)
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      dbSaveProducts(arr.map(toMeta));
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
      dbSaveProducts(arr.map(toMeta));
      return { products: arr };
    }),

  updateField: (id, field, value) =>
    set((s) => {
      const updated = s.products.map((p) => (p.id === id ? { ...p, [field]: value } : p));
      dbSaveProducts(updated.map(toMeta));
      return { products: updated };
    }),

  replaceImage: (id, file) => {
    dbSaveImage(id, file);
    set((s) => {
      const old = s.products.find((p) => p.id === id);
      if (old?.image && old.image !== PLACEHOLDER_IMG) URL.revokeObjectURL(old.image);
      const url = URL.createObjectURL(file);
      return {
        products: s.products.map((p) => (p.id === id ? { ...p, image: url } : p)),
      };
    });
  },

  importProducts: (rows, imageFiles) => {
    const fileMap = new Map<string, File>();
    imageFiles.forEach((f) => {
      const key = f.name.replace(/\.[^.]+$/, '').trim().toLowerCase();
      fileMap.set(key, f);
    });
    const newProducts: Product[] = rows.map((row, i) => {
      const id = String(Date.now() + i);
      const imageFile = fileMap.get(row.name.trim().toLowerCase());
      if (imageFile) dbSaveImage(id, imageFile);
      return {
        id,
        name: row.name,
        price: row.price,
        description: row.description || 'Descripción del producto.',
        image: imageFile ? URL.createObjectURL(imageFile) : PLACEHOLDER_IMG,
        bgColor: 'rgba(255,255,255,1)',
      };
    });
    set((s) => {
      const updated = [...s.products, ...newProducts];
      dbSaveProducts(updated.map(toMeta));
      return { products: updated };
    });
  },

  resetCatalog: () => {
    dbClearProducts();
    set({ products: [] });
  },
}));
