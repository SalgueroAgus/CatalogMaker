import { useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { PLACEHOLDER_IMG } from '../../utils/image';
import type { Product } from '../../types';

interface Props {
  product: Product;
}

const MAX_DESC = 500;

export function ProductCard({ product }: Props) {
  const updateField = useProductStore((s) => s.updateField);
  const replaceImage = useProductStore((s) => s.replaceImage);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!descRef.current) return;
    descRef.current.style.height = 'auto';
    descRef.current.style.height = `${descRef.current.scrollHeight}px`;
  }, [product.description]);

  return (
    <div
      className="product-cell"
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
        <label className="cell-img-overlay">
          <RefreshCw size={14} /> Cambiar
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) replaceImage(product.id, file);
            }}
          />
        </label>
      </div>
      <div className="cell-info">
        <div className="cell-info-row">
          <input
            type="text"
            className="cell-name"
            value={product.name}
            onChange={(e) => updateField(product.id, 'name', e.target.value)}
            placeholder="Nombre"
          />
          <input
            type="text"
            className="cell-price"
            value={product.price}
            onChange={(e) => updateField(product.id, 'price', e.target.value)}
            placeholder="$0"
          />
        </div>
        <textarea
          ref={descRef}
          className="cell-desc"
          rows={1}
          value={product.description}
          onChange={(e) => updateField(product.id, 'description', e.target.value.slice(0, MAX_DESC))}
          placeholder="Descripción..."
        />
      </div>
    </div>
  );
}
