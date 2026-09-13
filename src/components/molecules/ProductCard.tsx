import { useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTextareaAutoHeight } from '../../hooks/useTextareaAutoHeight';
import { DESCRIPTION_LIMIT, validateProductField } from '../../utils/products';
import { PLACEHOLDER_IMG } from '../../utils/image';
import type { Product } from '../../types';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const updateField = useProductStore((s) => s.updateField);
  const replaceImage = useProductStore((s) => s.replaceImage);
  const photoInput = useRef<HTMLInputElement>(null);
  const descriptionError = validateProductField('description', product.description);
  const fontFamily = useSettingsStore((s) => s.fonts.body);
  const fontSize = useSettingsStore((s) => s.fontSizes.body);
  const descRef = useTextareaAutoHeight(product.description, fontFamily, fontSize);

  return (
    <div
      className="product-cell grid-item"
      role="group"
      aria-label={`Producto ${product.name}`}
      tabIndex={-1}
      id={`cell-${product.id}`}
      data-product-id={product.id}
    >
      <div
        className="cell-img-area"
        style={{ background: product.bgColor || 'rgba(255,255,255,1)' }}
      >
        <img
          src={product.image}
          alt={product.name}
          data-product-id={product.id}
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
        />
        <button className="cell-img-overlay" onClick={() => photoInput.current?.click()} aria-label={`Cambiar foto de ${product.name}`}>
          <RefreshCw size={14} aria-hidden="true" /> Cambiar foto
        </button>
          <input
            ref={photoInput}
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) replaceImage(product.id, file);
              e.target.value = '';
            }}
          />
      </div>
      <div className="cell-info">
        <div className="cell-info-row">
          <input
            type="text"
            className="cell-name"
            aria-label={`Nombre de ${product.name}`}
            value={product.name}
            onChange={(e) => updateField(product.id, 'name', e.target.value)}
            placeholder="Nombre"
          />
          <input
            type="text"
            className="cell-price"
            aria-label={`Precio de ${product.name}`}
            value={product.price}
            onChange={(e) => updateField(product.id, 'price', e.target.value)}
            placeholder="$0"
          />
        </div>
        <textarea
          ref={descRef}
          className="cell-desc"
          aria-label={`Descripción de ${product.name}`}
          aria-invalid={!!descriptionError}
          title={descriptionError ?? undefined}
          maxLength={DESCRIPTION_LIMIT}
          rows={1}
          value={product.description}
          onChange={(e) => updateField(product.id, 'description', e.target.value)}
          placeholder="Descripción..."
        />
      </div>
    </div>
  );
}
