import { useRef, useState } from 'react';
import { ProductListItem } from '../molecules/ProductListItem';
import { useProductStore } from '../../store/useProductStore';
import { getProductPage } from '../../utils/chunks';

interface Props {
  visibleIds: Set<string>;
}

export function RightSidebar({ visibleIds }: Props) {
  const products = useProductStore((s) => s.products);
  const reorderProduct = useProductStore((s) => s.reorderProduct);

  const draggedIdRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ id: string; pos: 'top' | 'bottom' } | null>(null);

  const count = products.length;

  function handleDragStart(e: React.DragEvent, id: string) {
    draggedIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setDraggingId(id), 0);
  }

  function handleDragOver(e: React.DragEvent, id: string, el: HTMLElement) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = el.getBoundingClientRect();
    const pos = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';
    setDragOver({ id, pos });
  }

  function handleDrop(e: React.DragEvent, targetId: string, el: HTMLElement) {
    e.preventDefault();
    setDragOver(null);
    const fromId = draggedIdRef.current;
    if (!fromId || fromId === targetId) return;
    const rect = el.getBoundingClientRect();
    const above = e.clientY < rect.top + rect.height / 2;
    reorderProduct(fromId, targetId, above);
    draggedIdRef.current = null;
    setDraggingId(null);
  }

  function handleDragEnd() {
    setDragOver(null);
    setDraggingId(null);
    draggedIdRef.current = null;
  }

  return (
    <aside className="sidebar-right">
      <div className="rs-header">
        <h2>📋 Listado</h2>
        <span className="rs-count">
          {count} artículo{count !== 1 ? 's' : ''}
        </span>
      </div>

      {count === 0 ? (
        <div className="rs-empty">
          <span>📋</span>
          <p>Subí fotos para ver el listado aquí</p>
        </div>
      ) : (
        <div className="rs-list">
          {products.map((product, index) => (
            <div key={product.id}>
              {index % 3 === 0 && (
                <div className="rs-page-sep">Página {getProductPage(index)}</div>
              )}
              <ProductListItem
                product={product}
                index={index}
                total={count}
                isVisible={visibleIds.has(product.id)}
                isDragging={draggingId === product.id}
                dragOverPosition={
                  dragOver?.id === product.id ? dragOver.pos : null
                }
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
