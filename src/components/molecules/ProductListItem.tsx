import { usePersistenceStore } from '../../store/usePersistenceStore';
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, GripVertical, RefreshCw, X } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { DESCRIPTION_LIMIT, validateProductField } from '../../utils/products';
import { PLACEHOLDER_IMG } from '../../utils/image';
import { GradientPickerPopover } from '../atoms/GradientPickerPopover';
import type { Product } from '../../types';

interface Props {
  product: Product;
  index: number;
  total: number;
  isVisible: boolean;
  isDragging: boolean;
  dragOverPosition: 'top' | 'bottom' | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string, el: HTMLElement) => void;
  onDrop: (e: React.DragEvent, id: string, el: HTMLElement) => void;
  onDragEnd: () => void;
  onShowProduct: (id: string) => void;
}

export function ProductListItem({
  product, index, total, isVisible,
  isDragging, dragOverPosition,
  onDragStart, onDragOver, onDrop, onDragEnd, onShowProduct,
}: Props) {
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  const [descOpen, setDescOpen] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const moveProduct = useProductStore((s) => s.moveProduct);
  const descriptionError = validateProductField('description', product.description);
  const updateField = useProductStore((s) => s.updateField);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!descRef.current || !descOpen) return;
    descRef.current.style.height = 'auto';
    descRef.current.style.height = `${descRef.current.scrollHeight}px`;
  }, [product.description, descOpen]);
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const replaceImage = useProductStore((s) => s.replaceImage);

  const dragCls = [
    'rs-card',
    isVisible ? 'rs-card-visible' : '',
    isDragging ? 'dragging' : '',
    dragOverPosition === 'top' ? 'drag-over-top' : '',
    dragOverPosition === 'bottom' ? 'drag-over-bottom' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={dragCls}
      draggable
      data-id={product.id}
      onDragStart={(e) => onDragStart(e, product.id)}
      onDragOver={(e) => onDragOver(e, product.id, e.currentTarget as HTMLElement)}
      onDrop={(e) => onDrop(e, product.id, e.currentTarget as HTMLElement)}
      onDragEnd={onDragEnd}
      onDragLeave={(e) => {
        (e.currentTarget as HTMLElement).classList.remove('drag-over-top', 'drag-over-bottom');
      }}
    >
      <div className="rs-card-head">
        <div className="rs-card-left">
          <span className="rs-drag-handle" title="Arrastrar para reordenar">
            <GripVertical size={14} />
          </span>
          <button
            className="rs-index"
            onClick={() => onShowProduct(product.id)}
            aria-label={`Ver producto ${index + 1} en la vista previa`}
          >
            #{String(index + 1).padStart(2, '0')}
          </button>
        </div>
        <button
          className="rs-act-del"
          onClick={() => {
            if (confirm('¿Eliminar este producto del catálogo?')) deleteProduct(product.id);
          }}
          aria-label={`Eliminar producto ${index + 1}`}
        >
          <X size={14} aria-hidden="true" /> Eliminar
        </button>
      </div>

      <div className="rs-card-body">
        <div
          className="rs-thumb-wrap"
          style={{ background: product.bgColor || 'rgba(255,255,255,1)' }}
        >
          <img
            src={product.image}
            className="rs-thumb"
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          />

        </div>

        <div className="rs-fields">
          <label className="rs-field-label" htmlFor={`name-${product.id}`}>Nombre</label>
          <input
            id={`name-${product.id}`}
            type="text"
            className="rs-input rs-input-name"
            value={product.name}
            onChange={(e) => updateField(product.id, 'name', e.target.value)}
            placeholder="Nombre"
          />
          <label className="rs-field-label" htmlFor={`price-${product.id}`}>Precio</label>
          <input
            id={`price-${product.id}`}
            type="text"
            className="rs-input rs-input-price"
            value={product.price}
            onChange={(e) => updateField(product.id, 'price', e.target.value)}
            placeholder="$0.00"
          />
          <div className="rs-bg-row">
            <span className="rs-bg-label">Fondo</span>
            <GradientPickerPopover
              disabled={busy}
              value={product.bgColor || 'rgba(255,255,255,1)'}
              onChange={(v) => updateField(product.id, 'bgColor', v)}
              idSuffix={product.id}
            />
          </div>
        </div>
      </div>

      <div className="rs-product-actions">
        <button className="rs-action" onClick={() => photoInput.current?.click()}><RefreshCw size={16} aria-hidden="true" /> Cambiar foto</button>
        <input ref={photoInput} type="file" accept="image/*" hidden onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void replaceImage(product.id, file);
          e.target.value = '';
        }} />
        <button className="rs-action" disabled={index === 0} onClick={(e) => {
          const button = e.currentTarget;
          void moveProduct(product.id, 'up');
          requestAnimationFrame(() => {
            const target = button.disabled ? button.parentElement?.querySelector<HTMLButtonElement>('[data-move="down"]') : button;
            target?.focus();
          });
        }} data-move="up">Subir</button>
        <button className="rs-action" disabled={index === total - 1} onClick={(e) => {
          const button = e.currentTarget;
          void moveProduct(product.id, 'down');
          requestAnimationFrame(() => {
            const target = button.disabled ? button.parentElement?.querySelector<HTMLButtonElement>('[data-move="up"]') : button;
            target?.focus();
          });
        }} data-move="down">Bajar</button>
      </div>
      <button
        className="rs-desc-toggle"
        onClick={() => setDescOpen((o) => !o)}
        aria-expanded={descOpen}
        aria-controls={`description-panel-${product.id}`}
      >
        <ChevronRight className={`rs-desc-arrow ${descOpen ? 'open' : ''}`} size={12} aria-hidden="true" /> Descripción
      </button>
      <div className="rs-desc-body" id={`description-panel-${product.id}`} hidden={!descOpen}>
        <label className="rs-field-label" htmlFor={`description-${product.id}`}>Descripción</label>
        <textarea
          id={`description-${product.id}`}
          aria-invalid={!!descriptionError}
          aria-describedby={descriptionError ? `description-error-${product.id}` : undefined}
          maxLength={DESCRIPTION_LIMIT}
          ref={descRef}
          className="rs-desc-textarea"
          rows={2}
          value={product.description}
          onChange={(e) => updateField(product.id, 'description', e.target.value)}
          placeholder="Descripción..."
        />
        {descriptionError && <p className="field-error" id={`description-error-${product.id}`} role="alert">{descriptionError}</p>}
        <span className={`rs-desc-counter ${product.description.length >= DESCRIPTION_LIMIT ? 'rs-desc-counter-limit' : product.description.length >= 400 ? 'rs-desc-counter-warn' : ''}`}>
          {product.description.length} / {DESCRIPTION_LIMIT}
        </span>
      </div>
    </div>
  );
}
