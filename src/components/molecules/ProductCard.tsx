import { usePriceField } from '../../hooks/usePriceField';
import { useRef } from 'react';
import { MoveVertical, RefreshCw, Undo2 } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTextareaAutoHeight } from '../../hooks/useTextareaAutoHeight';
import { useImagePosition } from '../../hooks/useImagePosition';
import { DESCRIPTION_LIMIT, validateProductField } from '../../utils/products';
import { imagePositionStyle, PLACEHOLDER_IMG } from '../../utils/image';
import type { Product } from '../../types';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const updateField = useProductStore((s) => s.updateField);
  const replaceImage = useProductStore((s) => s.replaceImage);
  const photoInput = useRef<HTMLInputElement>(null);
  const { error: priceError, ...priceField } = usePriceField(product.price, (value) => updateField(product.id, 'price', value));
  const descriptionError = validateProductField('description', product.description);
  const fontFamily = useSettingsStore((s) => s.fonts.body);
  const fontSize = useSettingsStore((s) => s.fontSizes.body);
  const descRef = useTextareaAutoHeight(product.description, fontFamily, fontSize);
  const imagePosition = useImagePosition(product);

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
        <div
          className={`cell-img-frame${imagePosition.enabled ? ' cell-img-movable' : ''}${imagePosition.dragging ? ' cell-img-dragging' : ''}`}
          role="slider"
          aria-label={`Posición vertical de la foto de ${product.name}`}
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(imagePosition.position)}
          aria-valuetext={imagePosition.position === 0 ? 'Arriba' : imagePosition.position === 100 ? 'Abajo' : imagePosition.position === 50 ? 'Centro' : `${Math.round(imagePosition.position)}% desde arriba`}
          aria-disabled={!imagePosition.enabled}
          tabIndex={imagePosition.enabled ? 0 : -1}
          title="Arrastrá la foto hacia arriba o abajo. También podés usar las flechas del teclado."
          {...imagePosition.handlers}
        >
          <img
            src={product.image}
            alt={product.name}
            draggable={false}
            data-product-id={product.id}
            data-image-position-y={product.imagePositionY ?? 50}
            style={imagePositionStyle(imagePosition.position)}
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          />
        </div>
        {imagePosition.enabled && <span className="cell-img-hint" data-html2canvas-ignore="true"><MoveVertical size={14} aria-hidden="true" /> Arrastrá la foto</span>}
        {imagePosition.position !== 50 && <button className="cell-img-overlay cell-img-center" disabled={imagePosition.busy} onClick={imagePosition.center} aria-label={`Centrar foto de ${product.name}`} title="Centrar foto">
          <Undo2 size={16} aria-hidden="true" />
        </button>}
        <button className="cell-img-overlay" disabled={imagePosition.busy} onClick={() => photoInput.current?.click()} aria-label={`Cambiar foto de ${product.name}`}>
          <RefreshCw size={14} aria-hidden="true" /> Cambiar foto
        </button>
          <input
            ref={photoInput}
            hidden
            type="file"
            disabled={imagePosition.busy}
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
            data-export-price={product.price}
            size={Math.max(5, priceField.value.length)}
            aria-label={`Precio de ${product.name}`}
            {...priceField}
            placeholder="$0"
          />
        </div>
        {priceError && <span className="price-error" data-html2canvas-ignore="true" role="alert">{priceError}</span>}
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
