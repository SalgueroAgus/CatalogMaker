import { useState } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { PLACEHOLDER_IMG } from '../../utils/image';
import { scrollToProduct } from '../../utils/scroll';
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

export function ProductListItem({
  product, index, total, isVisible,
  isDragging, dragOverPosition,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: Props) {
  const [descOpen, setDescOpen] = useState(false);
  const updateField = useProductStore((s) => s.updateField);
  const moveProduct = useProductStore((s) => s.moveProduct);
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const replaceImage = useProductStore((s) => s.replaceImage);

  const dragCls = [
    'rs-card',
    isVisible ? 'rs-card-visible' : '',
    isDragging ? 'dragging' : '',
    dragOverPosition === 'top' ? 'drag-over-top' : '',
    dragOverPosition === 'bottom' ? 'drag-over-bottom' : '',
  ].filter(Boolean).join(' ');

  const bg = product.bgColor || '#ffffff';

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
          <span className="rs-drag-handle" title="Arrastrar">⠿</span>
          <span
            className="rs-index"
            onClick={() => scrollToProduct(product.id)}
            title="Ir al producto"
          >
            #{String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <div className="rs-card-actions">
          {index > 0 && (
            <button className="rs-act-btn" onClick={() => moveProduct(product.id, 'up')} title="Subir">↑</button>
          )}
          {index < total - 1 && (
            <button className="rs-act-btn" onClick={() => moveProduct(product.id, 'down')} title="Bajar">↓</button>
          )}
          <button
            className="rs-act-btn rs-act-del"
            onClick={() => {
              if (confirm('¿Eliminar este producto del catálogo?')) deleteProduct(product.id);
            }}
            title="Eliminar"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="rs-card-body">
        <div className="rs-thumb-wrap" style={{ backgroundColor: bg }}>
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
            <input
              type="color"
              className="rs-bg-picker"
              value={bg}
              onChange={(e) => updateField(product.id, 'bgColor', e.target.value)}
            />
            <span className="hex-label">{bg}</span>
          </div>
        </div>
      </div>

      <button className="rs-desc-toggle" onClick={() => setDescOpen((o) => !o)}>
        <span className={`rs-desc-arrow ${descOpen ? 'open' : ''}`}>▸</span> Descripción
      </button>
      <div className="rs-desc-body" style={{ maxHeight: descOpen ? '500px' : '0' }}>
        <textarea
          className="rs-desc-textarea"
          rows={3}
          value={product.description}
          onChange={(e) => updateField(product.id, 'description', e.target.value)}
          placeholder="Descripción..."
        />
      </div>
    </div>
  );
}
