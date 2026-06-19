import { useEffect, useRef, useState } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { PLACEHOLDER_IMG } from '../../utils/image';
import { scrollToProduct } from '../../utils/scroll';
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
}

function GripIcon() {
  return (
    <svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor" aria-hidden>
      <circle cx="2" cy="2" r="1.5" />
      <circle cx="8" cy="2" r="1.5" />
      <circle cx="2" cy="7" r="1.5" />
      <circle cx="8" cy="7" r="1.5" />
      <circle cx="2" cy="12" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
    </svg>
  );
}

const MAX_DESC = 500;

export function ProductListItem({
  product, index, total: _total, isVisible,
  isDragging, dragOverPosition,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: Props) {
  const [descOpen, setDescOpen] = useState(false);
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
      style={{ animationDelay: `${index * 0.025}s` }}
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
            <GripIcon />
          </span>
          <span
            className="rs-index"
            onClick={() => scrollToProduct(product.id)}
            title="Ir al producto"
          >
            #{String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <button
          className="rs-act-del"
          onClick={() => {
            if (confirm('¿Eliminar este producto del catálogo?')) deleteProduct(product.id);
          }}
          title="Eliminar"
        >
          ✕
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
          <label className="rs-thumb-overlay">
            🔄
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

        <div className="rs-fields">
          <input
            type="text"
            className="rs-input rs-input-name"
            value={product.name}
            onChange={(e) => updateField(product.id, 'name', e.target.value)}
            placeholder="Nombre"
          />
          <input
            type="text"
            className="rs-input rs-input-price"
            value={product.price}
            onChange={(e) => updateField(product.id, 'price', e.target.value)}
            placeholder="$0.00"
          />
          <div className="rs-bg-row">
            <span className="rs-bg-label">Fondo</span>
            <GradientPickerPopover
              value={product.bgColor || 'rgba(255,255,255,1)'}
              onChange={(v) => updateField(product.id, 'bgColor', v)}
              idSuffix={product.id}
            />
          </div>
        </div>
      </div>

      <button className="rs-desc-toggle" onClick={() => setDescOpen((o) => !o)}>
        <span className={`rs-desc-arrow ${descOpen ? 'open' : ''}`}>▸</span> Descripción
      </button>
      <div className="rs-desc-body" style={{ maxHeight: descOpen ? '600px' : '0' }}>
        <textarea
          ref={descRef}
          className="rs-desc-textarea"
          rows={2}
          value={product.description}
          onChange={(e) => updateField(product.id, 'description', e.target.value.slice(0, MAX_DESC))}
          placeholder="Descripción..."
        />
        <span className={`rs-desc-counter ${product.description.length >= MAX_DESC ? 'rs-desc-counter-limit' : product.description.length >= 400 ? 'rs-desc-counter-warn' : ''}`}>
          {product.description.length} / {MAX_DESC}
        </span>
      </div>
    </div>
  );
}
