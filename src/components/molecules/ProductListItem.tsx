import { useRef } from 'react';
import { ChevronDown, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { useProductStore } from '../../store/useProductStore';
import { useTextareaAutoHeight } from '../../hooks/useTextareaAutoHeight';
import { DESCRIPTION_LIMIT, validateProductField } from '../../utils/products';
import { PLACEHOLDER_IMG } from '../../utils/image';
import { GradientPickerPopover } from '../atoms/GradientPickerPopover';
import type { Product } from '../../types';

interface Props {
  product: Product;
  index: number;
  total: number;
  isVisible: boolean;
  active: boolean;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onShowProduct: (id: string) => void;
  onEdit: (id: string) => void;
}

export function ProductListItem({ product, index, total, isVisible, active, detailsOpen, onToggleDetails, onShowProduct, onEdit }: Props) {
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  const photoInput = useRef<HTMLInputElement>(null);
  const moveProduct = useProductStore((s) => s.moveProduct);
  const updateField = useProductStore((s) => s.updateField);
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const replaceImage = useProductStore((s) => s.replaceImage);
  const descriptionError = validateProductField('description', product.description);
  const descRef = useTextareaAutoHeight(product.description);
  const nameRef = useTextareaAutoHeight(product.name);

  function move(direction: 'up' | 'down', button: HTMLButtonElement) {
    void moveProduct(product.id, direction);
    requestAnimationFrame(() => {
      const target = button.disabled ? button.parentElement?.querySelector<HTMLButtonElement>(`[data-move="${direction === 'up' ? 'down' : 'up'}"]`) : button;
      target?.focus();
    });
  }

  return (
    <article className={`rs-card rs-product-card${isVisible ? ' rs-card-visible' : ''}`} data-id={product.id} aria-label={`Artículo ${index + 1}`} onFocusCapture={() => onEdit(product.id)} onClickCapture={() => onEdit(product.id)}>
      <div className="rs-product-summary">
        <div className="rs-product-photo">
          <div className="rs-thumb-wrap" style={{ background: product.bgColor || 'var(--product-bg)' }}>
            <img src={product.image} className="rs-thumb" alt="" loading="lazy" draggable={false} onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }} />
          </div>
          <span className="rs-product-number">#{String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="rs-fields">
          <label className="rs-field-label" htmlFor={`name-${product.id}`}>Nombre</label>
          <textarea id={`name-${product.id}`} ref={nameRef} rows={1} className="rs-input rs-input-name" value={product.name} disabled={busy} onChange={(e) => void updateField(product.id, 'name', e.target.value)} placeholder="Nombre" />
          <label className="rs-field-label" htmlFor={`price-${product.id}`}>Precio</label>
          <input id={`price-${product.id}`} type="text" className="rs-input rs-input-price" value={product.price} disabled={busy} onChange={(e) => void updateField(product.id, 'price', e.target.value)} placeholder="$0.00" />
        </div>
      </div>
      <div className="rs-summary-actions">
        <button className="rs-action" onClick={onToggleDetails} aria-expanded={detailsOpen} aria-controls={`details-${product.id}`}>
          <ChevronDown size={16} className={detailsOpen ? 'rs-details-open' : ''} aria-hidden="true" /> Detalles
        </button>
        <button className="rs-action" onClick={() => onShowProduct(product.id)} aria-label={`Ver catálogo, artículo ${index + 1}`}>
          <Eye size={16} aria-hidden="true" /> Ver catálogo
        </button>
      </div>
      <div className="rs-product-details" id={`details-${product.id}`} hidden={!detailsOpen}>
        <label className="rs-field-label" htmlFor={`description-${product.id}`}>Descripción</label>
        <textarea id={`description-${product.id}`} aria-invalid={!!descriptionError} aria-describedby={descriptionError ? `description-error-${product.id}` : undefined} maxLength={DESCRIPTION_LIMIT} ref={descRef} className="rs-desc-textarea" rows={2} value={product.description} disabled={busy} onChange={(e) => void updateField(product.id, 'description', e.target.value)} placeholder="Descripción..." />
        {descriptionError && <p className="field-error" id={`description-error-${product.id}`} role="alert">{descriptionError}</p>}
        <span className={`rs-desc-counter${product.description.length >= DESCRIPTION_LIMIT ? ' rs-desc-counter-limit' : product.description.length >= 400 ? ' rs-desc-counter-warn' : ''}`}>
          {product.description.length} / {DESCRIPTION_LIMIT}
        </span>
        <div className="rs-product-actions">
          <button className="rs-action" disabled={busy} onClick={() => photoInput.current?.click()}><RefreshCw size={16} aria-hidden="true" /> Cambiar foto</button>
          <input ref={photoInput} type="file" accept="image/*" hidden disabled={busy} onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void replaceImage(product.id, file);
            e.target.value = '';
          }} />
          <span className="rs-bg-row">
            <span className="rs-field-label">Fondo</span>
            <GradientPickerPopover disabled={busy || !detailsOpen || !active} value={product.bgColor || 'rgba(255,255,255,1)'} onChange={(value) => void updateField(product.id, 'bgColor', value)} idSuffix={product.id} />
          </span>
        </div>
        <div className="rs-product-actions">
          <button className="rs-action" disabled={busy || index === 0} data-move="up" onClick={(e) => move('up', e.currentTarget)}>Subir</button>
          <button className="rs-action" disabled={busy || index === total - 1} data-move="down" onClick={(e) => move('down', e.currentTarget)}>Bajar</button>
          <button className="rs-act-del" disabled={busy} onClick={() => {
            if (confirm('¿Eliminar este producto del catálogo?')) void deleteProduct(product.id);
          }} aria-label={`Eliminar producto ${index + 1}`}><Trash2 size={16} aria-hidden="true" /> Eliminar</button>
        </div>
      </div>
    </article>
  );
}
