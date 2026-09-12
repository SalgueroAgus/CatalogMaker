import type { Product } from '../types';

export const DESCRIPTION_LIMIT = 500;
export const EDITABLE_PRODUCT_FIELDS = ['name', 'price', 'description', 'bgColor'] as const;
export type EditableProductField = typeof EDITABLE_PRODUCT_FIELDS[number];

export function validateProductField(field: EditableProductField, value: string): string | null {
  if (!EDITABLE_PRODUCT_FIELDS.includes(field) || typeof value !== 'string') return 'Campo de producto inválido.';
  if (field === 'description' && value.length > DESCRIPTION_LIMIT) return `La descripción admite hasta ${DESCRIPTION_LIMIT} caracteres. Corregila para guardar.`;
  return null;
}

export function validateProductFields(product: Pick<Product, 'name' | 'price' | 'description'>): string | null {
  for (const field of ['name', 'price', 'description'] as const) {
    const error = validateProductField(field, product[field]);
    if (error) return error;
  }
  return null;
}
